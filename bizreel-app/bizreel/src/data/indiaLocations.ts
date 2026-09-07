// India Location Data: States, Districts, Tehsils (Talukas/Sub-districts), and Pincodes
// Provides instant client-side cascade selection for State -> District -> Tehsil -> Pincode

export const INDIA_STATES_DATA: Record<string, { districts: Record<string, { tehsils: string[]; pincodes: string[] }> }> = {
  "Madhya Pradesh": {
    districts: {
      "Indore": { tehsils: ["Indore", "Mhow (Dr. Ambedkar Nagar)", "Sanwer", "Depalpur", "Hatod", "Rau", "Bicholi Hapsi", "Kanadia"], pincodes: ["452001", "452002", "452003", "452005", "452007", "452009", "452010", "452011", "452012", "452014", "452016", "452018", "452020", "453441", "453551"] },
      "Bhopal": { tehsils: ["Huzur", "Berasia", "Kolar", "Govindpura", "City Circle", "TT Nagar"], pincodes: ["462001", "462002", "462003", "462011", "462016", "462021", "462023", "462026", "462030", "462038", "463106"] },
      "Jabalpur": { tehsils: ["Jabalpur", "Patan", "Sihora", "Majholi", "Panagar", "Shahpura", "Kundam"], pincodes: ["482001", "482002", "482003", "482004", "482005", "483001", "483119", "483225"] },
      "Gwalior": { tehsils: ["Gwalior", "Morar", "Dabra", "Bhitarwar", "Chinore", "Ghatigaon"], pincodes: ["474001", "474002", "474004", "474006", "474009", "474011", "475001", "475110"] },
      "Ujjain": { tehsils: ["Ujjain", "Nagda", "Khachrod", "Mahidpur", "Tarana", "Badnagar", "Ghatiya"], pincodes: ["456001", "456006", "456010", "456335", "456443", "456665"] },
      "Sagar": { tehsils: ["Sagar", "Banda", "Khurai", "Rahatgarh", "Bina", "Deori", "Rehli", "Shahgarh", "Malthone", "Kesli"], pincodes: ["470001", "470002", "470113", "470115", "470117", "470226"] },
      "Rewa": { tehsils: ["Huzur (Rewa)", "Mauganj", "Teonthar", "Sirmaur", "Semariya", "Mangawan", "Hanumana", "Gurh", "Jawa", "Naigarhi"], pincodes: ["486001", "486002", "486111", "486114", "486226", "486331", "486441"] },
      "Satna": { tehsils: ["Raghurajnagar (Satna)", "Maihar", "Nagod", "Amarpatan", "Ramnagar", "Unchehara", "Birsinghpur", "Kotar", "Majhgawan"], pincodes: ["485001", "485005", "485111", "485112", "485771", "485773"] },
      "Dewas": { tehsils: ["Dewas", "Sonkatch", "Bagli", "Kannod", "Khategaon", "Tonk Khurd", "Hatpipliya"], pincodes: ["455001", "455115", "455118", "455227", "455336", "455339"] },
      "Dhar": { tehsils: ["Dhar", "Badnawar", "Sardarpur", "Kukshi", "Manawar", "Dharampuri", "Gandhwani", "Pithampur", "Tirla"], pincodes: ["454001", "454449", "454660", "454665", "454775"] }
    }
  },
  "Maharashtra": {
    districts: {
      "Mumbai City": { tehsils: ["Mumbai City", "Colaba", "Fort", "Dadar", "Worli", "Byculla", "Malabar Hill"], pincodes: ["400001", "400002", "400005", "400006", "400014", "400018", "400025"] },
      "Mumbai Suburban": { tehsils: ["Andheri", "Bandra", "Borivali", "Kurla", "Ghatkopar", "Malad", "Kandivali", "Chembur", "Mulund"], pincodes: ["400050", "400051", "400053", "400058", "400064", "400067", "400070", "400071", "400080", "400092"] },
      "Pune": { tehsils: ["Pune City", "Haveli", "Baramati", "Shirur", "Khed", "Maval", "Ambegaon", "Junnar", "Bhor", "Indapur", "Daund", "Mulshi", "Velhe", "Purandar"], pincodes: ["411001", "411002", "411004", "411014", "411028", "411038", "411045", "411057", "412105", "413102"] },
      "Thane": { tehsils: ["Thane", "Kalyan", "Murbad", "Bhiwandi", "Shahapur", "Ulhasnagar", "Ambarnath"], pincodes: ["400601", "400602", "400604", "400607", "421201", "421301", "421302", "421501"] },
      "Nagpur": { tehsils: ["Nagpur Urban", "Nagpur Rural", "Kamptee", "Hingna", "Katol", "Narkhed", "Savner", "Kalmeshwar", "Ramtek", "Parseoni", "Mouda", "Umred", "Kuhi", "Bhiwapur"], pincodes: ["440001", "440002", "440010", "440012", "440022", "441107", "441108", "441203"] },
      "Nashik": { tehsils: ["Nashik", "Malegaon", "Sinnar", "Niphad", "Dindori", "Igatpuri", "Trimbak", "Yeola", "Chandwad", "Deola", "Baglan", "Kalwan", "Surgana", "Peint"], pincodes: ["422001", "422002", "422005", "422009", "422101", "423106", "423203"] },
      "Chhatrapati Sambhajinagar (Aurangabad)": { tehsils: ["Aurangabad", "Paithan", "Gangapur", "Vaijapur", "Kannad", "Khuldabad", "Sillod", "Soegaon", "Phulambri"], pincodes: ["431001", "431003", "431005", "431107", "431109", "431112", "431115"] }
    }
  },
  "Uttar Pradesh": {
    districts: {
      "Lucknow": { tehsils: ["Lucknow", "Bakshi Ka Talab", "Malihabad", "Mohanlalganj", "Sarojini Nagar"], pincodes: ["226001", "226002", "226003", "226010", "226012", "226016", "226020", "226024"] },
      "Kanpur Nagar": { tehsils: ["Kanpur Sadar", "Ghatampur", "Bilhaur", "Narwal"], pincodes: ["208001", "208002", "208005", "208012", "208022", "208025", "209206"] },
      "Varanasi": { tehsils: ["Varanasi Sadar", "Pindra", "Raja Talab (Rohania)"], pincodes: ["221001", "221002", "221005", "221010", "221101", "221206"] },
      "Prayagraj (Allahabad)": { tehsils: ["Sadar", "Phulpur", "Soraon", "Handia", "Karchhana", "Meja", "Bara", "Koraon"], pincodes: ["211001", "211002", "211003", "211006", "211019", "212402", "212301"] },
      "Agra": { tehsils: ["Agra Sadar", "Etmadpur", "Kiraoli", "Fatehabad", "Bah", "Kheragarh"], pincodes: ["282001", "282002", "282004", "282005", "282007", "283111", "283125"] },
      "Gautam Buddha Nagar (Noida)": { tehsils: ["Dadri (Noida)", "Greater Noida", "Jewar"], pincodes: ["201301", "201303", "201305", "201306", "201308", "201310", "203209"] },
      "Ghaziabad": { tehsils: ["Ghaziabad Sadar", "Modinagar", "Loni"], pincodes: ["201001", "201002", "201005", "201009", "201010", "201012", "201204"] }
    }
  },
  "Punjab": {
    districts: {
      "Ludhiana": { tehsils: ["Ludhiana East", "Ludhiana West", "Jagraon", "Khanna", "Samrala", "Payal", "Raikot"], pincodes: ["141001", "141002", "141003", "141008", "141109", "141401"] },
      "Amritsar": { tehsils: ["Amritsar-I", "Amritsar-II", "Ajnala", "Baba Bakala", "Majitha"], pincodes: ["143001", "143002", "143006", "143102", "143201"] },
      "Jalandhar": { tehsils: ["Jalandhar-I", "Jalandhar-II", "Nakodar", "Phillaur", "Shahkot"], pincodes: ["144001", "144002", "144008", "144022", "144040", "144601"] },
      "Kapurthala": { tehsils: ["Kapurthala", "Phagwara", "Sultanpur Lodhi", "Bholath"], pincodes: ["144601", "144401", "144626", "144622"] }
    }
  },
  "Delhi": {
    districts: {
      "Central Delhi": { tehsils: ["Connaught Place", "Kotwali", "Civil Lines", "Pahar Ganj", "Karol Bagh"], pincodes: ["110001", "110005", "110006", "110055"] },
      "South Delhi": { tehsils: ["Hauz Khas", "Saket", "Mehrauli"], pincodes: ["110016", "110017", "110030", "110048", "110062"] },
      "South East Delhi": { tehsils: ["Defence Colony", "Kalkaji", "Sarita Vihar"], pincodes: ["110014", "110019", "110024", "110044", "110076"] },
      "South West Delhi": { tehsils: ["Dwarka", "Vasant Vihar", "Najafgarh", "Kapashera"], pincodes: ["110021", "110037", "110043", "110075", "110077"] },
      "West Delhi": { tehsils: ["Patel Nagar", "Rajouri Garden", "Punjabi Bagh"], pincodes: ["110008", "110015", "110026", "110027", "110063"] }
    }
  },
  "Gujarat": {
    districts: {
      "Ahmedabad": { tehsils: ["Ahmedabad City", "Daskroi", "Dholka", "Sanand", "Viramgam", "Dhandhuka", "Bavla"], pincodes: ["380001", "380006", "380009", "380015", "380054", "382110"] },
      "Surat": { tehsils: ["Surat City", "Choryasi", "Kamrej", "Olpad", "Bardoli"], pincodes: ["395001", "395003", "395007", "395009", "394180"] }
    }
  },
  "Rajasthan": {
    districts: {
      "Jaipur": { tehsils: ["Jaipur", "Amer", "Sanganer", "Chaksu", "Bassi", "Kotputli"], pincodes: ["302001", "302002", "302004", "302015", "302019"] },
      "Jodhpur": { tehsils: ["Jodhpur", "Luni", "Bilara", "Bhopalgarh"], pincodes: ["342001", "342003", "342006", "342011"] }
    }
  }
};

export const getStatesList = (): string[] => Object.keys(INDIA_STATES_DATA);

export const getDistrictsForState = (stateName: string): string[] => {
  if (!stateName || !INDIA_STATES_DATA[stateName]) return [];
  return Object.keys(INDIA_STATES_DATA[stateName].districts);
};

export const getTehsilsForDistrict = (stateName: string, districtName: string): string[] => {
  if (!stateName || !districtName || !INDIA_STATES_DATA[stateName]) return [];
  const dist = INDIA_STATES_DATA[stateName].districts[districtName];
  if (!dist) return [];
  return dist.tehsils || [];
};

export const getPincodesForDistrict = (stateName: string, districtName: string): string[] => {
  if (!stateName || !districtName || !INDIA_STATES_DATA[stateName]) return [];
  const dist = INDIA_STATES_DATA[stateName].districts[districtName];
  if (!dist) return [];
  return dist.pincodes || [];
};

export const parseAddressString = (addressStr: string) => {
  if (!addressStr || typeof addressStr !== 'string') {
    return { state: '', district: '', tehsil: '', pincode: '', area: '' };
  }

  const result = {
    state: '',
    district: '',
    tehsil: '',
    pincode: '',
    area: addressStr,
  };

  const pinMatch = addressStr.match(/\b\d{6}\b/);
  if (pinMatch) {
    result.pincode = pinMatch[0];
  }

  for (const stateName of Object.keys(INDIA_STATES_DATA)) {
    if (new RegExp(`\\b${stateName}\\b`, 'i').test(addressStr)) {
      result.state = stateName;
      break;
    }
  }

  if (result.state) {
    const districts = getDistrictsForState(result.state);
    for (const distName of districts) {
      if (new RegExp(`\\b${distName}\\b`, 'i').test(addressStr)) {
        result.district = distName;
        break;
      }
    }
  } else {
    for (const [stateName, sData] of Object.entries(INDIA_STATES_DATA)) {
      for (const distName of Object.keys(sData.districts)) {
        if (new RegExp(`\\b${distName}\\b`, 'i').test(addressStr)) {
          result.state = stateName;
          result.district = distName;
          break;
        }
      }
      if (result.state) break;
    }
  }

  if (result.state && result.district) {
    const tehsils = getTehsilsForDistrict(result.state, result.district);
    for (const t of tehsils) {
      if (new RegExp(`\\b${t}\\b`, 'i').test(addressStr)) {
        result.tehsil = t;
        break;
      }
    }
  }

  return result;
};

export const lookupPincodeLocal = (pin: string) => {
  if (!pin || typeof pin !== 'string') return null;
  const cleanPin = pin.trim();
  for (const [stateName, sData] of Object.entries(INDIA_STATES_DATA)) {
    for (const [distName, dData] of Object.entries(sData.districts)) {
      if (dData.pincodes && dData.pincodes.includes(cleanPin)) {
        return {
          state: stateName,
          district: distName,
          tehsils: dData.tehsils || [],
          pincode: cleanPin,
        };
      }
    }
  }
  return null;
};
