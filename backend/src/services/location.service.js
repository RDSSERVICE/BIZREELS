const axios = require('axios');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Define PincodeCache Schema & Model inline
const pincodeCacheSchema = new mongoose.Schema({
  _id: String,
  pincode: String,
  area: String,
  city: String,
  state: String,
  country: String,
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } });

let PincodeCache;
try {
  PincodeCache = mongoose.model('PincodeCache');
} catch {
  PincodeCache = mongoose.model('PincodeCache', pincodeCacheSchema, 'pincode_cache');
}

// Define GeocodeCache Schema & Model inline
const geocodeCacheSchema = new mongoose.Schema({
  _id: String, // "lat_round,lng_round"
  area: String,
  city: String,
  state: String,
  district: String,
  pincode: String,
  country: String,
  fullAddress: String,
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } });

let GeocodeCache;
try {
  GeocodeCache = mongoose.model('GeocodeCache');
} catch {
  GeocodeCache = mongoose.model('GeocodeCache', geocodeCacheSchema, 'geocode_cache');
}

// Local in-memory cache for common testing/demo pincodes (0ms response)
const COMMON_PINCODES = {
  '110001': { area: 'Connaught Place', city: 'New Delhi', state: 'Delhi', country: 'India' },
  '400001': { area: 'Mumbai G.P.O.', city: 'Mumbai', state: 'Maharashtra', country: 'India' },
  '560001': { area: 'Bangalore G.P.O.', city: 'Bengaluru', state: 'Karnataka', country: 'India' },
  '600001': { area: 'Chennai G.P.O.', city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  '700001': { area: 'Kolkata G.P.O.', city: 'Kolkata', state: 'West Bengal', country: 'India' },
  '500001': { area: 'Hyderabad G.P.O.', city: 'Hyderabad', state: 'Telangana', country: 'India' },
  '380001': { area: 'Ahmedabad G.P.O.', city: 'Ahmedabad', state: 'Gujarat', country: 'India' },
  '411001': { area: 'Pune G.P.O.', city: 'Pune', state: 'Maharashtra', country: 'India' },
  '122001': { area: 'Gurgaon G.P.O.', city: 'Gurgaon', state: 'Haryana', country: 'India' },
  '201301': { area: 'Noida Sector 1', city: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', country: 'India' },
};

const PINCODE_API = 'https://api.postalpincode.in/pincode/{pincode}';

const pincodeLookup = async (pincode) => {
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    throw ApiError.badRequest('Pincode must be 6 digits');
  }

  // 1. Check COMMON_PINCODES memory cache
  if (COMMON_PINCODES[pincode]) {
    return { pincode, ...COMMON_PINCODES[pincode], source: 'memory_cache' };
  }

  // 2. Check DB cache
  const cached = await PincodeCache.findById(pincode);
  if (cached) {
    const obj = cached.toObject();
    delete obj._id;
    return { ...obj, source: 'db_cache' };
  }

  try {
    const res = await axios.get(PINCODE_API.replace('{pincode}', pincode), { timeout: 6000 });
    const data = res.data;
    const entry = Array.isArray(data) ? data[0] : data;

    if (entry.Status !== 'Success' || !entry.PostOffice || entry.PostOffice.length === 0) {
      throw ApiError.notFound('Pincode not found');
    }

    const po = entry.PostOffice[0];
    const tehsilCandidate = po.Block && po.Block !== 'NA' ? po.Block : (po.Taluk && po.Taluk !== 'NA' ? po.Taluk : po.Name);
    const result = {
      pincode,
      area: po.Name,
      city: po.District,
      district: po.District,
      tehsil: tehsilCandidate,
      state: po.State,
      country: po.Country || 'India',
      postOffices: entry.PostOffice.map(p => p.Name).filter(Boolean),
    };

    // Cache it
    try {
      await PincodeCache.updateOne(
        { _id: pincode },
        { $set: result },
        { upsert: true }
      );
    } catch {}

    return { ...result, source: 'postal_pincode' };
  } catch (err) {
    if (err.statusCode) throw err;
    logger.warn(`Pincode API failure: ${err.message}`);
    throw new ApiError(503, 'Pincode service temporarily unavailable');
  }
};

const reverseGeocode = async (lat, lng) => {
  // Round to 3 decimal places (~110 meters accuracy) for caching
  const roundedLat = parseFloat(lat.toFixed(3));
  const roundedLng = parseFloat(lng.toFixed(3));
  const cacheKey = `${roundedLat},${roundedLng}`;

  // 1. Check Geocode Cache
  try {
    const cached = await GeocodeCache.findById(cacheKey);
    if (cached) {
      const obj = cached.toObject();
      delete obj._id;
      return { ...obj, source: 'geocode_cache' };
    }
  } catch (err) {
    logger.warn(`Geocode cache read error: ${err.message}`);
  }

  try {
    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
      headers: {
        'User-Agent': 'BizReels/1.0 (contact@bizreels.in)'
      },
      timeout: 5000
    });

    if (res.data && res.data.address) {
      const addr = res.data.address;
      const pincode = addr.postcode || null;
      const state = addr.state || addr.region || null;
      const district = addr.state_district || addr.county || addr.city_district || null;
      const city = addr.city || addr.town || addr.village || addr.municipality || null;
      const area = addr.suburb || addr.neighbourhood || addr.road || null;
      const fullAddress = res.data.display_name || '';

      const result = {
        area,
        city: city || district,
        state,
        district: district || city,
        pincode,
        country: addr.country || 'India',
        fullAddress,
      };

      // Cache it in DB
      try {
        await GeocodeCache.updateOne(
          { _id: cacheKey },
          { $set: result },
          { upsert: true }
        );
      } catch (cacheErr) {
        logger.warn(`Geocode cache write error: ${cacheErr.message}`);
      }

      return { ...result, source: 'nominatim' };
    }
  } catch (err) {
    logger.warn(`Nominatim reverse geocode failure: ${err.message}. Falling back to metro default.`);
  }

  // Fallback to closest metro
  const metros = [
    { lat: 12.97, lng: 77.59, city: 'Bengaluru', state: 'Karnataka' },
    { lat: 28.61, lng: 77.20, city: 'New Delhi', state: 'Delhi' },
    { lat: 19.07, lng: 72.87, city: 'Mumbai', state: 'Maharashtra' },
    { lat: 17.38, lng: 78.48, city: 'Hyderabad', state: 'Telangana' },
    { lat: 13.08, lng: 80.27, city: 'Chennai', state: 'Tamil Nadu' },
    { lat: 22.57, lng: 88.36, city: 'Kolkata', state: 'West Bengal' },
    { lat: 18.52, lng: 73.85, city: 'Pune', state: 'Maharashtra' },
    { lat: 26.91, lng: 75.78, city: 'Jaipur', state: 'Rajasthan' },
  ];

  let best = metros[0];
  let minDist = Infinity;
  for (const m of metros) {
    const dist = Math.pow(m.lat - lat, 2) + Math.pow(m.lng - lng, 2);
    if (dist < minDist) {
      minDist = dist;
      best = m;
    }
  }

  return {
    area: null,
    city: best.city,
    state: best.state,
    pincode: null,
    country: 'India',
    fullAddress: `${best.city}, ${best.state}, India`,
    source: 'mock',
  };
};

const INDIA_STATES_DISTRICTS = {
  "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Prakasam", "Srikakulam", "Sri Potti Sriramulu Nellore", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
  "Arunachal Pradesh": ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"],
  "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Girish", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
  "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Wayanad"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
  "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  "Mizoram": ["Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Serchhip"],
  "Nagaland": ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Keonjhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Sri Muktsar Sahib", "Tarn Taran"],
  "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Allahabad", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Faizabad", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lakhimpur Kheri", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"],
  "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"],
  "Jammu and Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Mendhar", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
  "Ladakh": ["Kargil", "Leh"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  "Lakshadweep": ["Lakshadweep"],
  "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"]
};

const getStates = async () => {
  return Object.keys(INDIA_STATES_DISTRICTS);
};

const getDistricts = async (state) => {
  return INDIA_STATES_DISTRICTS[state] || [];
};

module.exports = {
  pincodeLookup,
  reverseGeocode,
  getStates,
  getDistricts,
};
