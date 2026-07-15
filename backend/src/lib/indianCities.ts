/** 200+ major Indian cities (from India_200_Plus_Major_Cities_AZ.xlsx), de-duplicated and
 * sorted ascending. Backs the City catalog auto-seed (see cityService.ensureCitiesSeeded)
 * and the standalone `npm run seed:cities` script. */
export const INDIAN_CITY_NAMES = [
  "Agartala", "Agra", "Ahmedabad", "Aizawl", "Ajmer", "Akola", "Alappuzha", "Aligarh",
  "Alipurduar", "Alwar", "Amaravati", "Ambala", "Ambikapur", "Amravati", "Amritsar", "Anand",
  "Anantapur", "Angul", "Ara", "Asansol", "Aurangabad", "Ayodhya", "Balasore", "Ballari",
  "Bareilly", "Bathinda", "Belagavi", "Bengaluru", "Berhampur", "Bhagalpur", "Bharatpur",
  "Bharuch", "Bhavnagar", "Bhilai", "Bhiwadi", "Bhopal", "Bhubaneswar", "Bhuj", "Bidar",
  "Bikaner", "Bilaspur", "Bokaro", "Bulandshahr", "Burdwan", "Chandigarh", "Chennai",
  "Coimbatore", "Cuttack", "Darbhanga", "Dehradun", "Delhi", "Dhanbad", "Dharwad", "Dibrugarh",
  "Dimapur", "Durg", "Durgapur", "Eluru", "Erode", "Faridabad", "Gandhinagar", "Gangtok",
  "Gaya", "Ghaziabad", "Gorakhpur", "Greater Noida", "Guntur", "Gurugram", "Guwahati",
  "Gwalior", "Haldwani", "Hamirpur", "Haridwar", "Hisar", "Hosur", "Howrah", "Hubballi",
  "Hyderabad", "Imphal", "Indore", "Itanagar", "Jabalpur", "Jaipur", "Jalandhar", "Jalgaon",
  "Jammu", "Jamnagar", "Jamshedpur", "Jodhpur", "Jorhat", "Junagadh", "Kakinada", "Kalaburagi",
  "Kanchipuram", "Kannur", "Kanpur", "Karimnagar", "Karnal", "Kasaragod", "Katni", "Khammam",
  "Kharagpur", "Kochi", "Kohima", "Kolhapur", "Kolkata", "Kollam", "Kota", "Kottayam",
  "Kozhikode", "Kurnool", "Kurukshetra", "Lucknow", "Ludhiana", "Madurai", "Malda", "Mangaluru",
  "Manipal", "Meerut", "Mohali", "Moradabad", "Mumbai", "Muzaffarpur", "Mysuru", "Nagpur",
  "Nanded", "Nashik", "Navi Mumbai", "Nellore", "Noida", "Panaji", "Patiala", "Patna",
  "Prayagraj", "Puducherry", "Pune", "Raipur", "Rajahmundry", "Rajkot", "Ranchi", "Roorkee",
  "Rourkela", "Salem", "Sambalpur", "Shillong", "Shimla", "Silchar", "Siliguri", "Solapur",
  "Sonipat", "Srinagar", "Surat", "Thanjavur", "Thiruvananthapuram", "Thrissur",
  "Tiruchirappalli", "Tirunelveli", "Tirupati", "Tumakuru", "Udaipur", "Udupi", "Vadodara",
  "Varanasi", "Vellore", "Vijayawada", "Visakhapatnam", "Warangal", "Yamunanagar",
] as const;
