// India Location Data: States, Districts, Tehsils (Talukas/Sub-districts), and Pincodes
// Provides instant client-side cascade selection for State -> District -> Tehsil -> Pincode

export const INDIA_STATES_DATA = {
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
      "Dhar": { tehsils: ["Dhar", "Badnawar", "Sardarpur", "Kukshi", "Manawar", "Dharampuri", "Gandhwani", "Pithampur", "Tirla"], pincodes: ["454001", "454449", "454660", "454665", "454775"] },
      "Khargone": { tehsils: ["Khargone", "Kasrawad", "Maheshwar", "Barwaha", "Sanawad", "Bhikangaon", "Gogawan", "Segaon", "Jhirnya"], pincodes: ["451001", "451111", "451115", "451228", "451335", "451441"] },
      "Khandwa": { tehsils: ["Khandwa", "Pandhana", "Punasa", "Harsud", "Khalwa", "Chhegaon Makhan"], pincodes: ["450001", "450110", "450114", "450116", "450119"] },
      "Ratlam": { tehsils: ["Ratlam", "Jaora", "Sailana", "Alot", "Piploda", "Bajna", "Rawti"], pincodes: ["457001", "457118", "457222", "457226", "457339"] },
      "Mandsaur": { tehsils: ["Mandsaur", "Malhargarh", "Garoth", "Bhanpura", "Sitamau", "Daloda", "Shamgarh", "Suwasra"], pincodes: ["458001", "458002", "458110", "458389", "458553", "458883"] },
      "Neemuch": { tehsils: ["Neemuch", "Jawad", "Manasa", "Singoli", "Jeeran"], pincodes: ["458441", "458116", "458220", "458330"] },
      "Hoshangabad (Narmadapuram)": { tehsils: ["Narmadapuram", "Itarsi", "Pipariya", "Sohagpur", "Babai (Makhan Nagar)", "Seoni Malwa", "Bankhedi", "Dolariya"], pincodes: ["461001", "461111", "461775", "461771", "461661", "461223"] },
      "Sehore": { tehsils: ["Sehore", "Ashta", "Ichhawar", "Budhni", "Nasrullaganj (Bhairunda)", "Shyampur", "Jawar"], pincodes: ["466001", "466116", "466115", "466445", "466554"] },
      "Vidisha": { tehsils: ["Vidisha", "Basoda", "Kurwai", "Sironj", "Lateri", "Gyaraspur", "Gulabganj", "Shamshabad", "Nateran"], pincodes: ["464001", "464221", "464228", "464551", "464668"] },
      "Raisen": { tehsils: ["Raisen", "Goharganj (Mandi Deep)", "Begamganj", "Gairatganj", "Silwani", "Bareli", "Udaipura", "Badi", "Sultanpur"], pincodes: ["464551", "462046", "464881", "464990", "464993"] },
      "Betul": { tehsils: ["Betul", "Multai", "Amla", "Bhainsdehi", "Shahpur", "Chicholi", "Athner", "Ghodadongri"], pincodes: ["460001", "460661", "460551", "460330", "460443"] },
      "Chhindwara": { tehsils: ["Chhindwara", "Parasia", "Sausar", "Pandhurna", "Amarwara", "Chourai", "Jamai (Junnardeo)", "Tamia", "Harrai", "Mohkhed", "Bichhua"], pincodes: ["480001", "480441", "480106", "480334", "480221", "480115"] },
      "Balaghat": { tehsils: ["Balaghat", "Waraseoni", "Katangi", "Baihar", "Lalburra", "Lanji", "Kirnapur", "Paraswada", "Tirodi", "Birsa", "Khairlanji"], pincodes: ["481001", "481331", "481441", "481111", "481226"] },
      "Seoni": { tehsils: ["Seoni", "Lakhnadon", "Barghat", "Keolari", "Ghansore", "Chhapara", "Kurai", "Dhanora"], pincodes: ["480661", "480886", "480667", "480990", "480994"] },
      "Damoh": { tehsils: ["Damoh", "Hatta", "Patharia", "Batiyagarh", "Patera", "Jabera", "Tendukheda"], pincodes: ["470661", "470775", "470666", "470673", "470881"] },
      "Chhatarpur": { tehsils: ["Chhatarpur", "Nowgong", "Rajnagar (Khajuraho)", "Bijawar", "Bada Malhera", "Laundi", "Gaurihar", "Baxwaha", "Chandla"], pincodes: ["471001", "471201", "471606", "471405", "471311", "471515"] },
      "Tikamgarh": { tehsils: ["Tikamgarh", "Baldeogarh", "Jatara", "Palera", "Mohangarh", "Khargapur", "Niwari", "Prithvipur", "Orchha"], pincodes: ["472001", "472111", "472118", "472246", "472339", "472442"] },
      "Panna": { tehsils: ["Panna", "Ajaigarh", "Gunnor", "Pawai", "Shahnagar", "Devendranagar", "Amanganj"], pincodes: ["488001", "488220", "488050", "488441", "488442"] },
      "Morena": { tehsils: ["Morena", "Ambah", "Porsa", "Joura", "Sabalgarh", "Kailaras"], pincodes: ["476001", "476111", "476115", "476221", "476229"] },
      "Bhind": { tehsils: ["Bhind", "Ater", "Mehgaon", "Gohad", "Lahar", "Roun", "Mihona"], pincodes: ["477001", "477105", "477331", "477445", "477557"] },
      "Shivpuri": { tehsils: ["Shivpuri", "Karera", "Kolaras", "Pohari", "Pichhore", "Khaniyadhana", "Badarwas", "Narwar"], pincodes: ["473551", "473660", "473770", "473774", "473995"] },
      "Guna": { tehsils: ["Guna", "Raghogarh", "Chachoura", "Aron", "Kumbhraj", "Bamori"], pincodes: ["473001", "473226", "473118", "473101", "473222"] },
      "Shahdol": { tehsils: ["Sohagpur (Shahdol)", "Beohari", "Jaisinghnagar", "Gohparu", "Jaitpur"], pincodes: ["484001", "484774", "484771", "484669"] },
      "Singrauli": { tehsils: ["Singrauli (Waidhan)", "Deosar", "Chitrangi", "Mada", "Sarai"], pincodes: ["486889", "486886", "486882", "486881"] }
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
      "Chhatrapati Sambhajinagar (Aurangabad)": { tehsils: ["Aurangabad", "Paithan", "Gangapur", "Vaijapur", "Kannad", "Khuldabad", "Sillod", "Soegaon", "Phulambri"], pincodes: ["431001", "431003", "431005", "431107", "431109", "431112", "431115"] },
      "Kolhapur": { tehsils: ["Karvir (Kolhapur)", "Ichalkaranji", "Hatkanangle", "Shirol", "Panhala", "Shahuwadi", "Radhanagari", "Kagal", "Bhudargad", "Ajra", "Gadhinglaj", "Chandgad"], pincodes: ["416001", "416002", "416003", "416115", "416109", "416216"] },
      "Solapur": { tehsils: ["Solapur North", "Solapur South", "Pandharpur", "Barshi", "Madha", "Karmala", "Mohol", "Akkalkot", "Malshiras", "Sangola", "Mangalwedha"], pincodes: ["413001", "413002", "413003", "413304", "413401", "413203"] },
      "Raigad (Navi Mumbai)": { tehsils: ["Panvel", "Alibag", "Pen", "Karjat", "Khalapur", "Roha", "Mangaon", "Mahad", "Murud", "Shrivardhan", "Tala", "Uran", "Poladpur", "Mhasla"], pincodes: ["410206", "410210", "410218", "402107", "402201", "402301"] }
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
      "Ghaziabad": { tehsils: ["Ghaziabad Sadar", "Modinagar", "Loni"], pincodes: ["201001", "201002", "201005", "201009", "201010", "201012", "201204"] },
      "Meerut": { tehsils: ["Meerut Sadar", "Mawana", "Sardhana"], pincodes: ["250001", "250002", "250004", "250106", "250342", "250401"] },
      "Bareilly": { tehsils: ["Bareilly Sadar", "Aonla", "Faridpur", "Baheri", "Meerganj", "Nawabganj"], pincodes: ["243001", "243003", "243005", "243122", "243201", "243504"] },
      "Gorakhpur": { tehsils: ["Sadar", "Chauri Chaura", "Sahjanwa", "Khajni", "Bansgaon", "Campierganj", "Gola"], pincodes: ["273001", "273004", "273008", "273015", "273202", "273406"] },
      "Aligarh": { tehsils: ["Koil (Aligarh)", "Khair", "Atrauli", "Iglas", "Gabhana"], pincodes: ["202001", "202002", "202138", "202141", "202124"] },
      "Mathura": { tehsils: ["Mathura", "Vrindavan", "Chhata", "Mant", "Goverdhan", "Mahavan"], pincodes: ["281001", "281003", "281121", "281401", "281502"] },
      "Jhansi": { tehsils: ["Jhansi", "Mauranipur", "Garautha", "Moth", "Tahrauli"], pincodes: ["284001", "284002", "284003", "284204", "284303"] }
    }
  },
  "Rajasthan": {
    districts: {
      "Jaipur": { tehsils: ["Jaipur", "Amer", "Sanganer", "Chaksu", "Bassi", "Kotputli", "Shahpura", "Chomu", "Phulera", "Dudu", "Viratnagar", "Jamwa Ramgarh"], pincodes: ["302001", "302002", "302004", "302015", "302019", "302020", "302033", "303103", "303303"] },
      "Jodhpur": { tehsils: ["Jodhpur", "Luni", "Bilara", "Bhopalgarh", "Piparcity", "Osian", "Phalodi", "Balesar", "Shergarh", "Baori"], pincodes: ["342001", "342003", "342006", "342011", "342301", "342602"] },
      "Udaipur": { tehsils: ["Girwa (Udaipur)", "Badgaon", "Mavli", "Vallabhnagar", "Salumber", "Kherwara", "Jhadol", "Kotra", "Gogunda", "Rishabhdeo"], pincodes: ["313001", "313002", "313004", "313603", "313705", "313803"] },
      "Kota": { tehsils: ["Ladpura (Kota)", "Digod", "Sangod", "Ramganj Mandi", "Pipalda", "Kanwas"], pincodes: ["324001", "324005", "324007", "324009", "325001", "326519"] },
      "Ajmer": { tehsils: ["Ajmer", "Pushkar", "Kishangarh", "Beawar", "Nasirabad", "Kekri", "Sarwar", "Bhinai", "Masuda"], pincodes: ["305001", "305002", "305022", "305801", "305802", "305901"] },
      "Bikaner": { tehsils: ["Bikaner", "Nokha", "Lunkaransar", "Kolayat", "Khajuwala", "Dungargarh", "Chhatargarh"], pincodes: ["334001", "334003", "334005", "334803", "334603"] },
      "Alwar": { tehsils: ["Alwar", "Tijara", "Behror", "Kishangarh Bas", "Ramgarh", "Rajgarh", "Thanagazi", "Bansur", "Kathumar", "Neemrana", "Kotkasim"], pincodes: ["301001", "301019", "301404", "301701", "301705"] },
      "Bhilwara": { tehsils: ["Bhilwara", "Shahpura", "Mandal", "Mandalgarh", "Asind", "Jahazpur", "Kotri", "Raipur", "Sahada", "Banera", "Bijolia", "Hurda"], pincodes: ["311001", "311011", "311404", "311604", "311802"] }
    }
  },
  "Gujarat": {
    districts: {
      "Ahmedabad": { tehsils: ["Ahmedabad City", "Daskroi", "Dholka", "Sanand", "Viramgam", "Dhandhuka", "Bavla", "Mandal", "Detroj"], pincodes: ["380001", "380006", "380009", "380015", "380054", "382110", "382210"] },
      "Surat": { tehsils: ["Surat City", "Choryasi", "Kamrej", "Olpad", "Bardoli", "Mahuva", "Mandvi", "Mangrol", "Palsana", "Umarpada"], pincodes: ["395001", "395003", "395007", "395009", "394180", "394601"] },
      "Vadodara": { tehsils: ["Vadodara City", "Vadodara Rural", "Padra", "Karjan", "Savli", "Vaghodia", "Dabhoi", "Sinor", "Desar"], pincodes: ["390001", "390007", "390015", "390020", "391440", "391240"] },
      "Rajkot": { tehsils: ["Rajkot", "Gondal", "Jetpur", "Dhoraji", "Jasdan", "Upleta", "Kotda Sangani", "Lodhika", "Paddhari", "Vinchhiya"], pincodes: ["360001", "360002", "360005", "360311", "360370", "360020"] },
      "Gandhinagar": { tehsils: ["Gandhinagar", "Kalol", "Dehgam", "Mansa"], pincodes: ["382010", "382016", "382024", "382721", "382305"] }
    }
  },
  "Delhi": {
    districts: {
      "Central Delhi": { tehsils: ["Connaught Place", "Kotwali", "Civil Lines", "Pahar Ganj", "Karol Bagh"], pincodes: ["110001", "110005", "110006", "110055"] },
      "South Delhi": { tehsils: ["Hauz Khas", "Saket", "Mehrauli"], pincodes: ["110016", "110017", "110030", "110048", "110062"] },
      "South East Delhi": { tehsils: ["Defence Colony", "Kalkaji", "Sarita Vihar"], pincodes: ["110014", "110019", "110024", "110044", "110076"] },
      "South West Delhi": { tehsils: ["Dwarka", "Vasant Vihar", "Najafgarh", "Kapashera"], pincodes: ["110021", "110037", "110043", "110075", "110077"] },
      "West Delhi": { tehsils: ["Patel Nagar", "Rajouri Garden", "Punjabi Bagh"], pincodes: ["110008", "110015", "110026", "110027", "110063"] },
      "North West Delhi": { tehsils: ["Rohini", "Kanjhawala", "Saraswati Vihar"], pincodes: ["110034", "110081", "110085", "110086"] },
      "North Delhi": { tehsils: ["Alipur", "Model Town", "Narela"], pincodes: ["110007", "110009", "110036", "110040"] },
      "East Delhi": { tehsils: ["Gandhi Nagar", "Preet Vihar", "Mayur Vihar"], pincodes: ["110031", "110091", "110092", "110096"] }
    }
  },
  "Bihar": {
    districts: {
      "Patna": { tehsils: ["Patna Sadar", "Danapur", "Barh", "Masaurhi", "Paliganj", "Bikram", "Phulwari Sharif", "Fatuha", "Bakhtiarpur", "Maner"], pincodes: ["800001", "800003", "800014", "800020", "801503", "803214"] },
      "Gaya": { tehsils: ["Gaya Sadar", "Bodh Gaya", "Tekari", "Sherghati", "Imamganj", "Manpur", "Belaganj", "Wazirganj", "Atri"], pincodes: ["823001", "823002", "824231", "824211", "824232"] },
      "Muzaffarpur": { tehsils: ["Musahari (Muzaffarpur)", "Kanti", "Motipur", "Sahebganj", "Marwan", "Paroo", "Sakra", "Kurhani"], pincodes: ["842001", "842002", "843109", "843111", "843119"] },
      "Bhagalpur": { tehsils: ["Jagdishpur (Bhagalpur)", "Nathnagar", "Kahalgaon", "Naugachhia", "Pirpainti", "Sultanganj", "Bihpur", "Gopalpur", "Sabour"], pincodes: ["812001", "812002", "813203", "813204", "813214"] }
    }
  },
  "Chhattisgarh": {
    districts: {
      "Raipur": { tehsils: ["Raipur", "Arang", "Abhanpur", "Tilda Newra", "Kharora", "Gobranawapara"], pincodes: ["492001", "492006", "492010", "492015", "493225", "493441"] },
      "Durg": { tehsils: ["Durg", "Bhilai-3", "Patan", "Dhamdha", "Bori", "Ahiwara"], pincodes: ["491001", "490006", "490020", "490023", "491111", "491331"] },
      "Bilaspur": { tehsils: ["Bilaspur", "Bilha", "Kota", "Takhatpur", "Masturi", "Ratanpur", "Belgahna"], pincodes: ["495001", "495004", "495006", "495113", "495330"] },
      "Korba": { tehsils: ["Korba", "Katghora", "Pali", "Kartala", "Poundi Uproda", "Hardeebazar"], pincodes: ["495677", "495445", "495449", "495684"] }
    }
  },
  "Karnataka": {
    districts: {
      "Bengaluru Urban": { tehsils: ["Bengaluru North", "Bengaluru South", "Bengaluru East", "Anekal", "Yelahanka", "K.R. Puram"], pincodes: ["560001", "560002", "560004", "560025", "560034", "560068", "560095", "560100"] },
      "Mysuru": { tehsils: ["Mysuru", "Nanjangud", "Hunsur", "T. Narasipura", "K.R. Nagar", "Heggadadevankote", "Piriyapatna", "Saragur"], pincodes: ["570001", "570004", "570008", "570020", "571301", "571105"] }
    }
  },
  "Telangana": {
    districts: {
      "Hyderabad": { tehsils: ["Hyderabad", "Secunderabad", "Ameerpet", "Khairatabad", "Charminar", "Golconda", "Musheerabad", "Asifnagar", "Bahadurpura"], pincodes: ["500001", "500002", "500003", "500004", "500016", "500028", "500034", "500081"] }
    }
  },
  "Tamil Nadu": {
    districts: {
      "Chennai": { tehsils: ["Egmore", "Guindy", "Mylapore", "Tondiarpet", "Perambur", "Velachery", "Aminjikarai", "Mambalam", "Purasawalkam"], pincodes: ["600001", "600002", "600004", "600006", "600017", "600028", "600040", "600086"] },
      "Coimbatore": { tehsils: ["Coimbatore North", "Coimbatore South", "Pollachi", "Mettupalayam", "Sulur", "Annur", "Madukkarai", "Perur", "Valparai", "Kinathukadavu", "Anaimalai"], pincodes: ["641001", "641002", "641012", "641018", "641037", "642001"] }
    }
  },
  "West Bengal": {
    districts: {
      "Kolkata": { tehsils: ["Kolkata Central", "Kolkata North", "Kolkata South", "Alipore", "Bhowanipore", "Ballygunge", "Salt Lake", "New Town", "Behala"], pincodes: ["700001", "700004", "700016", "700019", "700027", "700034", "700064", "700091"] },
      "Howrah": { tehsils: ["Howrah Sadar", "Bally", "Uluberia", "Sankrail", "Domjur", "Panchla", "Amta", "Udaynarayanpur", "Bagnan", "Shyampur"], pincodes: ["711101", "711102", "711104", "711201", "711316"] }
    }
  },
  "Punjab": {
    districts: {
      "Ludhiana": { tehsils: ["Ludhiana East", "Ludhiana West", "Jagraon", "Khanna", "Samrala", "Payal", "Raikot"], pincodes: ["141001", "141002", "141003", "141008", "141109", "141401"] },
      "Amritsar": { tehsils: ["Amritsar-I", "Amritsar-II", "Ajnala", "Baba Bakala", "Majitha"], pincodes: ["143001", "143002", "143006", "143102", "143201"] },
      "Jalandhar": { tehsils: ["Jalandhar-I", "Jalandhar-II", "Nakodar", "Phillaur", "Shahkot"], pincodes: ["144001", "144002", "144008", "144022", "144040", "144601"] }
    }
  },
  "Haryana": {
    districts: {
      "Gurugram (Gurgaon)": { tehsils: ["Gurugram", "Badshahpur", "Manesar", "Wazirabad", "Sohna", "Pataudi", "Farrukhnagar"], pincodes: ["122001", "122002", "122011", "122018", "122051", "122102"] },
      "Faridabad": { tehsils: ["Faridabad", "Ballabgarh", "Badkhal", "Dhauj", "Tigaon"], pincodes: ["121001", "121002", "121004", "121007", "121008"] },
      "Ambala": { tehsils: ["Ambala", "Ambala Cantt", "Barara", "Naraingarh", "Saha"], pincodes: ["133001", "133004", "134203", "133104"] }
    }
  },
  "Uttarakhand": {
    districts: {
      "Dehradun": { tehsils: ["Dehradun Sadar", "Rishikesh", "Vikasnagar", "Chakrata", "Doiwala", "Kalsi", "Tyuni"], pincodes: ["248001", "248002", "248006", "249201", "248198"] },
      "Haridwar": { tehsils: ["Haridwar", "Roorkee", "Laksar", "Bhagwanpur"], pincodes: ["249401", "249403", "249407", "247667", "247663"] }
    }
  },
  "Jharkhand": {
    districts: {
      "Ranchi": { tehsils: ["Ranchi Sadar", "Kanke", "Namkum", "Hatia", "Ratu", "Bundu", "Ormanjhi", "Mandar", "Nagri", "Itki", "Bero"], pincodes: ["834001", "834002", "834004", "834008", "834009", "835221"] },
      "Dhanbad": { tehsils: ["Dhanbad Sadar", "Jharia", "Baghmara", "Sindri", "Nirsa", "Tundi", "Govindpur", "Baliapur"], pincodes: ["826001", "826004", "828111", "828122", "828205"] },
      "East Singhbhum (Jamshedpur)": { tehsils: ["Golmuri Cum Jugsalai (Jamshedpur)", "Ghatshila", "Potka", "Baharagora", "Chakulia", "Musabani"], pincodes: ["831001", "831002", "831003", "831011", "831012", "832303"] }
    }
  },
  "Odisha": {
    districts: {
      "Khordha (Bhubaneswar)": { tehsils: ["Bhubaneswar", "Jatni", "Khordha", "Balianta", "Balipatna", "Begunia", "Bolagarh", "Banapur"], pincodes: ["751001", "751002", "751003", "751010", "751024", "752050"] },
      "Cuttack": { tehsils: ["Cuttack Sadar", "Athagarh", "Banki", "Choudwar", "Salepur", "Tangi-Choudwar", "Baramba", "Narsinghpur"], pincodes: ["753001", "753002", "753003", "753012", "754029"] }
    }
  },
  "Andhra Pradesh": {
    districts: {
      "Visakhapatnam": { tehsils: ["Visakhapatnam Urban", "Gajuwaka", "Anakapalle", "Bheemunipatnam", "Pendurthi"], pincodes: ["530001", "530002", "530016", "530026", "530046"] },
      "Krishna (Vijayawada)": { tehsils: ["Vijayawada Urban", "Vijayawada Rural", "Machilipatnam", "Gannavaram", "Gudivada"], pincodes: ["520001", "520002", "520008", "520010", "521001"] }
    }
  },
  "Kerala": {
    districts: {
      "Ernakulam (Kochi)": { tehsils: ["Kanayannur (Kochi)", "Kochi", "Aluva", "Kothamangalam", "Muvattupuzha", "Paravur"], pincodes: ["682001", "682011", "682016", "682030", "683101"] },
      "Thiruvananthapuram": { tehsils: ["Thiruvananthapuram", "Neyyattinkara", "Nedumangad", "Attingal", "Varkala", "Kattakada"], pincodes: ["695001", "695004", "695014", "695033", "695141"] }
    }
  },
  "Assam": {
    districts: {
      "Kamrup Metropolitan (Guwahati)": { tehsils: ["Guwahati", "Dispur", "Sonapur", "Chandrapur", "Azara"], pincodes: ["781001", "781003", "781005", "781006", "781017"] }
    }
  },
  "Goa": {
    districts: {
      "North Goa": { tehsils: ["Tiswadi (Panaji)", "Bardez (Mapusa)", "Pernem", "Bicholim", "Sattari"], pincodes: ["403001", "403507", "403512", "403504"] },
      "South Goa": { tehsils: ["Salcete (Margao)", "Mormugao (Vasco)", "Ponda", "Quepem", "Canacona", "Sanguem", "Dharbandora"], pincodes: ["403601", "403802", "403401", "403705"] }
    }
  },
  "Himachal Pradesh": {
    districts: {
      "Shimla": { tehsils: ["Shimla Urban", "Shimla Rural", "Theog", "Rampur", "Rohru", "Kotkhai", "Jubbal", "Chopal", "Kumarsain"], pincodes: ["171001", "171002", "171004", "171009", "171201"] },
      "Kangra": { tehsils: ["Dharamshala", "Kangra", "Palampur", "Nurpur", "Dehra Gopipur", "Jawali", "Baijnath"], pincodes: ["176215", "176001", "176061", "176202"] }
    }
  },
  "Jammu and Kashmir": {
    districts: {
      "Srinagar": { tehsils: ["Srinagar North", "Srinagar South", "Eidgah", "Pantha Chowk", "Khanyar", "Chanapora"], pincodes: ["190001", "190002", "190006", "190015"] },
      "Jammu": { tehsils: ["Jammu", "Jammu South", "Jammu West", "Akhnoor", "Bishnah", "R.S. Pura", "Bahu"], pincodes: ["180001", "180002", "180004", "180010", "181122"] }
    }
  },
  "Chandigarh": {
    districts: {
      "Chandigarh": { tehsils: ["Chandigarh", "Sector 1-30", "Sector 31-60", "Manimajra"], pincodes: ["160001", "160002", "160017", "160022", "160036", "160101"] }
    }
  }
};

export const getStatesList = () => Object.keys(INDIA_STATES_DATA);

export const getDistrictsForState = (stateName) => {
  if (!stateName || !INDIA_STATES_DATA[stateName]) return [];
  return Object.keys(INDIA_STATES_DATA[stateName].districts);
};

export const getTehsilsForDistrict = (stateName, districtName) => {
  if (!stateName || !districtName || !INDIA_STATES_DATA[stateName]) return [];
  const dist = INDIA_STATES_DATA[stateName].districts[districtName];
  if (!dist) return [];
  return dist.tehsils || [];
};

export const getPincodesForDistrict = (stateName, districtName) => {
  if (!stateName || !districtName || !INDIA_STATES_DATA[stateName]) return [];
  const dist = INDIA_STATES_DATA[stateName].districts[districtName];
  if (!dist) return [];
  return dist.pincodes || [];
};

/**
 * Parse an existing raw address string into structured parts:
 * state, district, tehsil, pincode, area
 */
export const parseAddressString = (addressStr) => {
  if (!addressStr || typeof addressStr !== 'string') {
    return { state: '', district: '', tehsil: '', pincode: '', area: '' };
  }

  const result = {
    state: '',
    district: '',
    tehsil: '',
    pincode: '',
    area: addressStr
  };

  // 1. Extract 6 digit pincode if present
  const pinMatch = addressStr.match(/\b\d{6}\b/);
  if (pinMatch) {
    result.pincode = pinMatch[0];
  }

  // 2. Search for matching state
  for (const stateName of Object.keys(INDIA_STATES_DATA)) {
    if (new RegExp(`\\b${stateName}\\b`, 'i').test(addressStr)) {
      result.state = stateName;
      break;
    }
  }

  // 3. If state found, search for matching district
  if (result.state) {
    const districts = getDistrictsForState(result.state);
    for (const distName of districts) {
      if (new RegExp(`\\b${distName}\\b`, 'i').test(addressStr)) {
        result.district = distName;
        break;
      }
    }
  } else {
    // Check all districts across states
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

  // 4. Search for matching Tehsil
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

/**
 * Fast in-memory lookup for a pincode
 */
export const lookupPincodeLocal = (pin) => {
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

