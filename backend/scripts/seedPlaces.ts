/**
 * Loads the Explore page with places and eateries for 20 of the country's biggest
 * student/college cities — the things a student who just moved somewhere unfamiliar would
 * want to find first.
 *
 * Conventions, and why:
 *
 * 1. `mapsLink` is a Google Maps *search* URL, not a place ID or an embedded map. Same
 *    reasoning as seedProducts' Amazon search links: a search never 404s and always resolves
 *    to the current listing, hours and reviews. The Place model's own comment already fixes
 *    this expectation — "a plain Google Maps search/place URL, not an API integration".
 * 2. Nothing is invented. `rating`, `imageUrl` and `openingHours` are left out entirely rather
 *    than guessed — all three render conditionally on the card (place-card.tsx:45,64,77), so
 *    an entry without them just shows name, area, blurb and a map link. Hours in particular
 *    move around and a wrong one sends a student across the city for nothing.
 * 3. `address` is the locality, not a street address — enough to place it on a mental map and
 *    to disambiguate the Maps search, without asserting a door number I can't stand behind.
 * 4. Only long-established, widely-known venues, so the list ages slowly. Verify before trusting:
 *    these come from general knowledge, not a live source, and places do close. The Places admin
 *    editor is the place to correct anything that has.
 *
 * City names must match `lib/indianCities.ts` exactly — `listPlaces` matches city with an
 * anchored case-insensitive regex (placeService.ts:14), so "Bangalore" would seed rows that
 * the Bengaluru filter can never return.
 *
 * Idempotent — upserts by { city, name }. Re-running updates copy in place; it deliberately
 * does NOT touch rating/imageUrl/openingHours, so anything an admin adds through the editor
 * survives a re-seed. Unlike `npm run seed`, this writes only to the Place collection, which
 * makes it safe against a live deployment.
 *
 * Usage: npm run seed:places
 */
import "dotenv/config";
import mongoose from "mongoose";

import { Place } from "@/models/Place";
import type { PlaceCategory } from "@/types";

interface PlaceSeed {
  category: PlaceCategory;
  name: string;
  /** Locality — see note 3 above. */
  address: string;
  /** One line, written for a student: why go, what it costs you, when it's worth the trip. */
  description: string;
  featured?: boolean;
}

/** Google's documented Maps search URL. Encoding is not optional here — "Kyani & Co." would
 * otherwise truncate the query at the ampersand, and the apostrophes in "Karim's"/"Humayun's"
 * would travel raw. */
const maps = (name: string, city: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city}`)}`;

const CITY_PLACES: Record<string, PlaceSeed[]> = {
  Delhi: [
    {
      category: "Tourist Place",
      name: "India Gate",
      address: "Kartavya Path, Central Delhi",
      description: "Free, open late, and where half of Delhi ends up on a warm evening. The obvious first outing.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Qutub Minar",
      address: "Mehrauli, South Delhi",
      description: "The 12th-century tower and the ruins around it. Yellow Line to Qutub Minar, then a short auto ride.",
    },
    {
      category: "Tourist Place",
      name: "Humayun's Tomb",
      address: "Nizamuddin East, Central Delhi",
      description: "Quieter than the Red Fort and better preserved — the garden tomb the Taj was modelled on.",
    },
    {
      category: "Tourist Place",
      name: "Red Fort",
      address: "Netaji Subhash Marg, Chandni Chowk",
      description: "Pair it with a Chandni Chowk food walk in the same trip — they're a ten-minute walk apart.",
    },
    {
      category: "Tourist Place",
      name: "Hauz Khas Village",
      address: "Hauz Khas, South Delhi",
      description: "Medieval ruins and a lake on one side, cafes and bars on the other. Good for an unplanned afternoon.",
    },
    {
      category: "Temple",
      name: "Lotus Temple",
      address: "Kalkaji, South Delhi",
      description: "Free entry, silent inside, open to everyone. Go on a weekday — weekend queues are long.",
    },
    {
      category: "Temple",
      name: "Akshardham Temple",
      address: "Noida Mor, East Delhi",
      description: "Vast and free to enter. Phones and bags aren't allowed in, so travel light and budget time for security.",
    },
    {
      category: "Nearby Attraction",
      name: "Taj Mahal",
      address: "Agra, ~230 km from Delhi",
      description: "A genuine day trip: the Gatimaan Express gets you to Agra in about 100 minutes and back the same evening.",
    },
    {
      category: "Restaurant",
      name: "Karim's",
      address: "Gali Kababian, Jama Masjid",
      description: "Mughlai cooking near Jama Masjid, running since 1913. Go with a group and split plates.",
      featured: true,
    },
    {
      category: "Street Food",
      name: "Paranthe Wali Gali",
      address: "Chandni Chowk, Old Delhi",
      description: "A whole lane of stuffed parathas fried to order. Cheap, heavy, and best before noon.",
      featured: true,
    },
    {
      category: "Street Food",
      name: "Chache Di Hatti",
      address: "Kamla Nagar, North Campus",
      description: "Chole bhature the size of your head, on a DU student's budget. Expect to queue at lunch.",
    },
    {
      category: "Cafe",
      name: "Big Yellow Door",
      address: "Satya Niketan, South Campus",
      description: "Built around student wallets — the whole of Satya Niketan is, which is why South Campus eats there.",
    },
    {
      category: "Cafe",
      name: "Depaul's",
      address: "Janpath, Connaught Place",
      description: "A standing counter, not a cafe. The cold coffee is the cheapest good thing in Connaught Place.",
    },
    {
      category: "Market",
      name: "Sarojini Nagar Market",
      address: "Sarojini Nagar, South Delhi",
      description: "Export-surplus clothes for a few hundred rupees if you'll haggle. Go early on a weekday to avoid the crush.",
      featured: true,
    },
    {
      category: "Market",
      name: "Dilli Haat INA",
      address: "INA, South Delhi",
      description: "Crafts and regional food from every state under one roof. Small entry fee; fixed-ish prices, unlike Sarojini.",
    },
    {
      category: "Park",
      name: "Lodhi Garden",
      address: "Lodhi Road, Central Delhi",
      description: "Free, green, and full of tombs to sit against. The default Delhi spot for running or reading outdoors.",
    },
  ],

  Mumbai: [
    {
      category: "Tourist Place",
      name: "Gateway of India",
      address: "Apollo Bandar, Colaba",
      description: "The city's front door, and where the Elephanta ferries leave from. Free to walk up to.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Marine Drive",
      address: "Netaji Subhash Chandra Bose Road, Churchgate",
      description: "Three kilometres of sea wall that costs nothing to sit on. Mumbai's cheapest evening, every evening.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Juhu Beach",
      address: "Juhu, Western Suburbs",
      description: "Go for the bhelpuri and pav bhaji stalls at the entrance more than for the swimming.",
    },
    {
      category: "Tourist Place",
      name: "Bandra Bandstand Promenade",
      address: "Bandra West",
      description: "A rocky seafront walk with sunset over the sea. Combine it with Hill Road for street shopping.",
    },
    {
      category: "Station",
      name: "Chhatrapati Shivaji Maharaj Terminus",
      address: "Fort, South Mumbai",
      description: "A working railway station that's also a UNESCO site — worth ten minutes on your way through.",
    },
    {
      category: "Nearby Attraction",
      name: "Elephanta Caves",
      address: "Elephanta Island, Mumbai Harbour",
      description: "Rock-cut caves an hour's ferry from the Gateway. A half-day trip; the last boat back is early, so check it.",
    },
    {
      category: "Temple",
      name: "Siddhivinayak Temple",
      address: "Prabhadevi, Central Mumbai",
      description: "The city's best-known temple. Tuesdays are packed to a standstill — any other morning is calmer.",
    },
    {
      category: "Mosque",
      name: "Haji Ali Dargah",
      address: "Worli, South Mumbai",
      description: "Reached by a causeway that the sea covers at high tide, so go when the tide is out.",
    },
    {
      category: "Restaurant",
      name: "Cafe Madras",
      address: "Matunga East",
      description: "South Indian breakfasts since the 1940s, in the middle of Mumbai's Tamil neighbourhood. Cash-friendly and quick.",
      featured: true,
    },
    {
      category: "Restaurant",
      name: "Kyani & Co.",
      address: "Marine Lines, South Mumbai",
      description: "One of the last Irani cafes — bun maska and chai for the price of a metro ticket.",
    },
    {
      category: "Street Food",
      name: "Bademiya",
      address: "Tulloch Road, Colaba",
      description: "A late-night kebab stall behind the Taj that has been feeding Colaba for decades.",
    },
    {
      category: "Market",
      name: "Colaba Causeway",
      address: "Colaba, South Mumbai",
      description: "Street stalls for clothes, jewellery and books. Quote half the asking price and work up.",
    },
    {
      category: "Market",
      name: "Linking Road",
      address: "Bandra West",
      description: "Shoes and clothes off the pavement at Sarojini prices, without leaving the western suburbs.",
    },
    {
      category: "Park",
      name: "Sanjay Gandhi National Park",
      address: "Borivali, Northern Suburbs",
      description: "Actual forest inside the city, with the Kanheri Caves in it. Cheap entry and a full day out.",
    },
    {
      category: "Library",
      name: "David Sassoon Library",
      address: "Kala Ghoda, Fort",
      description: "A 19th-century reading room with a garden. Membership is modest if you'll use it regularly.",
    },
  ],

  Bengaluru: [
    {
      category: "Park",
      name: "Lalbagh Botanical Garden",
      address: "Mavalli, South Bengaluru",
      description: "240 acres and a glass house, for a few rupees. Free before a set morning hour, which is when runners use it.",
      featured: true,
    },
    {
      category: "Park",
      name: "Cubbon Park",
      address: "Central Bengaluru",
      description: "Free, central, and closed to cars on Sundays — which is when it fills with students and skaters.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Bangalore Palace",
      address: "Vasanth Nagar, Central Bengaluru",
      description: "Tudor-style palace with an audio tour. Ticket prices are steep for what it is — go once, on a slow weekend.",
    },
    {
      category: "Tourist Place",
      name: "Vidhana Soudha",
      address: "Ambedkar Veedhi, Central Bengaluru",
      description: "The state legislature building, floodlit on Sunday evenings. You see it from outside; that's the point of it.",
    },
    {
      category: "Temple",
      name: "Bull Temple",
      address: "Basavanagudi, South Bengaluru",
      description: "A single huge granite Nandi from the 16th century. Ten minutes from the Gandhi Bazaar dosa shops.",
    },
    {
      category: "Temple",
      name: "ISKCON Temple Bangalore",
      address: "Rajajinagar, West Bengaluru",
      description: "Hilltop complex; the free prasadam queue is an institution among students living nearby.",
    },
    {
      category: "Nearby Attraction",
      name: "Nandi Hills",
      address: "~60 km north of Bengaluru",
      description: "The standard Bengaluru sunrise trip. Leave around 4am; go on a weekday if you want to see anything but cars.",
    },
    {
      category: "Restaurant",
      name: "Vidyarthi Bhavan",
      address: "Gandhi Bazaar, Basavanagudi",
      description: "Benne masala dosa since 1943 — the name literally means students' place. Expect to wait; it moves fast.",
      featured: true,
    },
    {
      category: "Restaurant",
      name: "Mavalli Tiffin Rooms (MTR)",
      address: "Lalbagh Road, South Bengaluru",
      description: "The rava idli's birthplace. Do it after a Lalbagh morning — they're a few minutes apart.",
    },
    {
      category: "Restaurant",
      name: "Central Tiffin Room (CTR)",
      address: "Malleshwaram, North Bengaluru",
      description: "Also called Shri Sagar. Benne dosa in a small room with a permanent queue outside — join it anyway.",
    },
    {
      category: "Street Food",
      name: "VV Puram Food Street",
      address: "Sajjan Rao Circle, VV Puram",
      description: "One lane, dozens of stalls, opens in the evening. The cheapest way to eat well in this city.",
      featured: true,
    },
    {
      category: "Cafe",
      name: "Airlines Hotel",
      address: "Lavelle Road, Central Bengaluru",
      description: "Open-air filter coffee under trees, from a drive-in that predates the tech city. Cheap and unhurried.",
    },
    {
      category: "Cafe",
      name: "Corner House",
      address: "Residency Road, Central Bengaluru",
      description: "Death by Chocolate, and the reason it exists. Split one — the portions defeat most people.",
    },
    {
      category: "Market",
      name: "Commercial Street",
      address: "Tasker Town, Central Bengaluru",
      description: "Clothes and shoes across every price band on one walkable stretch. Weekends are shoulder-to-shoulder.",
    },
    {
      category: "Market",
      name: "Chickpet Market",
      address: "Chickpet, West Bengaluru",
      description: "Wholesale fabric and clothing lanes. Much cheaper than Commercial Street if you can handle the crowd.",
    },
    {
      category: "Library",
      name: "State Central Library",
      address: "Cubbon Park, Central Bengaluru",
      description: "The red building inside Cubbon Park. Free reading rooms — a real option when the hostel is too loud.",
    },
  ],

  Chennai: [
    {
      category: "Tourist Place",
      name: "Marina Beach",
      address: "Marina, Central Chennai",
      description: "One of the world's longest urban beaches. Evenings only — the midday sun here is not a joke.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Elliot's Beach",
      address: "Besant Nagar, South Chennai",
      description: "Smaller and calmer than the Marina, ringed by cafes. Where students actually go.",
    },
    {
      category: "Tourist Place",
      name: "Fort St. George",
      address: "Rajaji Salai, George Town",
      description: "The first English fort in India, now government offices with a museum inside. Carry ID.",
    },
    {
      category: "Tourist Place",
      name: "Government Museum",
      address: "Pantheon Road, Egmore",
      description: "The bronze gallery is the reason to go. Cheap student ticket; allow a couple of hours.",
    },
    {
      category: "Temple",
      name: "Kapaleeshwarar Temple",
      address: "Mylapore, Central Chennai",
      description: "The gopuram and the tank at the centre of old Mylapore. Free; mornings and evenings only.",
      featured: true,
    },
    {
      category: "Church",
      name: "San Thome Basilica",
      address: "Santhome, Central Chennai",
      description: "Built over the tomb of St. Thomas the Apostle. Five minutes from the south end of the Marina.",
    },
    {
      category: "Nearby Attraction",
      name: "Mahabalipuram",
      address: "~55 km south of Chennai",
      description: "Shore temple and rock carvings, an easy bus ride down the ECR. The standard Chennai day trip.",
      featured: true,
    },
    {
      category: "Restaurant",
      name: "Murugan Idli Shop",
      address: "T. Nagar, Central Chennai",
      description: "Idlis with unlimited chutney, served on a banana leaf. Reliable, everywhere, and cheap.",
      featured: true,
    },
    {
      category: "Restaurant",
      name: "Ratna Cafe",
      address: "Triplicane, Central Chennai",
      description: "Famous for drowning its idlis in sambar since 1948. A full breakfast for pocket change.",
    },
    {
      category: "Restaurant",
      name: "Saravana Bhavan",
      address: "K.K. Nagar and citywide",
      description: "The safe default anywhere in the city — consistent vegetarian meals at a fixed, low price.",
    },
    {
      category: "Street Food",
      name: "Sowcarpet",
      address: "Sowcarpet, George Town",
      description: "North Indian chaat in the middle of Chennai. Evening lanes; go hungry and bring cash.",
    },
    {
      category: "Cafe",
      name: "Amethyst Cafe",
      address: "Whites Road, Royapettah",
      description: "A garden cafe in a colonial bungalow. Pricier than campus rates — save it for when someone visits.",
    },
    {
      category: "Market",
      name: "Ranganathan Street",
      address: "T. Nagar, Central Chennai",
      description: "Chennai's densest shopping street. Everything you need to set up a room, if you can stand the crowd.",
    },
    {
      category: "Market",
      name: "Pondy Bazaar",
      address: "T. Nagar, Central Chennai",
      description: "Pavement stalls and a proper footpath, so it's an easier version of Ranganathan Street.",
    },
    {
      category: "Library",
      name: "Connemara Public Library",
      address: "Egmore, Central Chennai",
      description: "One of India's four legal deposit libraries — it holds a copy of nearly everything published here.",
    },
    {
      category: "Park",
      name: "Guindy National Park",
      address: "Guindy, South Chennai",
      description: "A national park inside the city, next to the children's park and snake farm. Cheap and rarely crowded.",
    },
  ],

  Kolkata: [
    {
      category: "Tourist Place",
      name: "Victoria Memorial",
      address: "Maidan, Central Kolkata",
      description: "The marble one on every postcard. The gardens are the cheap part; the museum is worth the extra.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Howrah Bridge",
      address: "Howrah, over the Hooghly",
      description: "Best seen from a ferry across the river — a few rupees, and the crossing beats the traffic anyway.",
    },
    {
      category: "Tourist Place",
      name: "Princep Ghat",
      address: "Strand Road, Central Kolkata",
      description: "Riverfront steps under the Vidyasagar Setu. Free, and the standard place to sit out an evening.",
    },
    {
      category: "Tourist Place",
      name: "Indian Museum",
      address: "Chowringhee, Central Kolkata",
      description: "The oldest museum in India, and enormous. Student tickets are cheap; pick two wings, not all of them.",
    },
    {
      category: "Temple",
      name: "Dakshineswar Kali Temple",
      address: "Dakshineswar, North Kolkata",
      description: "On the river, at the end of the metro line. Pair it with Belur Math on the opposite bank by ferry.",
    },
    {
      category: "Church",
      name: "St. Paul's Cathedral",
      address: "Cathedral Road, Central Kolkata",
      description: "Next door to the Victoria Memorial, so they're one trip, not two.",
    },
    {
      category: "Nearby Attraction",
      name: "Belur Math",
      address: "Belur, Howrah — ~30 minutes from the centre",
      description: "The Ramakrishna Mission headquarters, quiet gardens on the Hooghly. Reachable by ferry from Dakshineswar.",
    },
    {
      category: "Cafe",
      name: "Indian Coffee House",
      address: "Bankim Chatterjee Street, College Street",
      description: "The student cafe — decades of arguments over cheap coffee in a hall with a high ceiling. Go once, stay hours.",
      featured: true,
    },
    {
      category: "Cafe",
      name: "Flurys",
      address: "Park Street, Central Kolkata",
      description: "A 1927 tearoom. Breakfast costs more than a hostel day, so treat it as an occasion.",
    },
    {
      category: "Restaurant",
      name: "Peter Cat",
      address: "Park Street, Central Kolkata",
      description: "Chelo kebab and nothing else, really. Expect a wait; there's no booking.",
    },
    {
      category: "Restaurant",
      name: "Arsalan",
      address: "Park Circus, Central Kolkata",
      description: "Kolkata biryani, which comes with a potato and an egg — an argument you'll have here eventually.",
    },
    {
      category: "Street Food",
      name: "Dacres Lane",
      address: "James Hickey Sarani, Dalhousie",
      description: "A lunch lane of benches and stew. Office Kolkata eats here, and it's about as cheap as the city gets.",
    },
    {
      category: "Market",
      name: "College Street",
      address: "College Street, North Kolkata",
      description: "Kilometres of second-hand book stalls. Course texts for a fraction of new — the most useful street in the city.",
      featured: true,
    },
    {
      category: "Market",
      name: "New Market",
      address: "Lindsay Street, Central Kolkata",
      description: "A Victorian covered market that sells everything. Ignore the guides who attach themselves to you at the door.",
    },
    {
      category: "Park",
      name: "Maidan",
      address: "Central Kolkata",
      description: "The vast green the city is built around. Free football most mornings, and you can just join in.",
    },
    {
      category: "Library",
      name: "National Library of India",
      address: "Belvedere Estate, Alipore",
      description: "The country's largest library, in a colonial mansion. Free reading passes for students with ID.",
    },
  ],

  Hyderabad: [
    {
      category: "Tourist Place",
      name: "Charminar",
      address: "Old City, Hyderabad",
      description: "The city's centre of gravity, with the bazaars wrapped around its feet. Go up if the queue is short.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Golconda Fort",
      address: "Ibrahim Bagh, West Hyderabad",
      description: "A hill fort with acoustics that carry a clap to the top. Climb it near sunset, not at midday.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Chowmahalla Palace",
      address: "Khilwat, Old City",
      description: "The Nizams' palace, ten minutes' walk from Charminar. Small, air-conditioned, and a good midday break.",
    },
    {
      category: "Tourist Place",
      name: "Salar Jung Museum",
      address: "Dar-ul-Shifa, Old City",
      description: "One man's collection, and it's vast. The veiled Rebecca and the musical clock are what everyone comes for.",
    },
    {
      category: "Tourist Place",
      name: "Tank Bund and Hussain Sagar",
      address: "Tank Bund Road, Central Hyderabad",
      description: "The lake between the twin cities, with the Buddha statue on its island. Free to walk; boats cost little.",
    },
    {
      category: "Temple",
      name: "Birla Mandir",
      address: "Naubath Pahad, Central Hyderabad",
      description: "White marble on a hill, with the best free view over the city. No phones inside.",
    },
    {
      category: "Mosque",
      name: "Mecca Masjid",
      address: "Old City, beside Charminar",
      description: "One of India's oldest and largest mosques, right next to Charminar — the same trip.",
    },
    {
      category: "Nearby Attraction",
      name: "Ramoji Film City",
      address: "~30 km east of Hyderabad",
      description: "The world's largest film studio complex, run as a theme park. A full day and a real ticket price — plan it.",
    },
    {
      category: "Restaurant",
      name: "Paradise",
      address: "Secunderabad",
      description: "The biryani everyone names first. Split a family pack between three and it stops being expensive.",
      featured: true,
    },
    {
      category: "Restaurant",
      name: "Shah Ghouse Cafe",
      address: "Tolichowki, West Hyderabad",
      description: "Where the biryani argument usually ends up. Late hours, and closer to most western-suburb campuses.",
    },
    {
      category: "Restaurant",
      name: "Cafe Bahar",
      address: "Basheerbagh, Central Hyderabad",
      description: "Biryani without the tourist markup. Cash, crowds, no ceremony.",
    },
    {
      category: "Cafe",
      name: "Nimrah Cafe and Bakery",
      address: "Charminar, Old City",
      description: "Irani chai and Osmania biscuits in the shadow of Charminar, for about the cost of nothing.",
      featured: true,
    },
    {
      category: "Street Food",
      name: "Gokul Chat",
      address: "Koti, Central Hyderabad",
      description: "The city's best-known chat counter. Order, elbow in, eat standing.",
    },
    {
      category: "Market",
      name: "Laad Bazaar",
      address: "Charminar, Old City",
      description: "The bangle lanes beside Charminar. Also the cheapest place to buy pearls, if you know what you're doing.",
    },
    {
      category: "Market",
      name: "Sultan Bazaar",
      address: "Koti, Central Hyderabad",
      description: "Clothes and household basics at student prices — the practical place to kit out a room.",
    },
    {
      category: "Park",
      name: "KBR National Park",
      address: "Jubilee Hills, West Hyderabad",
      description: "A walking loop through actual forest, in the middle of the city. Nominal entry; peacocks at dawn.",
    },
  ],

  Pune: [
    {
      category: "Tourist Place",
      name: "Shaniwar Wada",
      address: "Shaniwar Peth, Central Pune",
      description: "The Peshwas' fortified palace, mostly burnt ruins now. The evening light-and-sound show tells the actual story.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Aga Khan Palace",
      address: "Nagar Road, Yerwada",
      description: "Where Gandhi was held under house arrest; his and Kasturba's memorials are in the garden. Quiet and cheap.",
    },
    {
      category: "Nearby Attraction",
      name: "Sinhagad Fort",
      address: "~35 km southwest of Pune",
      description: "The standard student trek — go for the kanda bhaji and buttermilk stalls at the top as much as the fort.",
      featured: true,
    },
    {
      category: "Temple",
      name: "Dagdusheth Halwai Ganpati Temple",
      address: "Budhwar Peth, Central Pune",
      description: "Pune's best-known temple, a few minutes from Shaniwar Wada. Expect a queue on any Tuesday.",
    },
    {
      category: "Temple",
      name: "Pataleshwar Cave Temple",
      address: "Shivajinagar",
      description: "A small 8th-century rock-cut cave temple wedged between JM Road traffic. Five minutes, free, worth it.",
    },
    {
      category: "Restaurant",
      name: "Vaishali",
      address: "FC Road, Shivajinagar",
      description: "The Fergusson College institution — queue for a table on weekend mornings for the sabudana khichdi.",
      featured: true,
    },
    {
      category: "Restaurant",
      name: "Roopali",
      address: "FC Road, Shivajinagar",
      description: "Vaishali's rival across the road, same crowd, same prices. Locals pick a side; both are fine.",
    },
    {
      category: "Cafe",
      name: "Goodluck Cafe",
      address: "Deccan Gymkhana",
      description: "An Irani cafe running since 1935, famous for bun maska and the Mastani milkshake it invented.",
      featured: true,
    },
    {
      category: "Cafe",
      name: "German Bakery",
      address: "Koregaon Park",
      description: "Rebuilt after 2010 and still the KP hangout — breakfasts and shakes at Osho-crowd prices.",
    },
    {
      category: "Park",
      name: "Sarasbaug",
      address: "Sarasbaug, Central Pune",
      description: "A lake-garden around the Ganpati temple. Free, shaded, and full of joggers by 6am.",
    },
    {
      category: "Market",
      name: "FC Road",
      address: "Shivajinagar",
      description: "Pune's student shopping street — clothes, accessories and a cafe every few doors.",
    },
    {
      category: "Market",
      name: "Laxmi Road",
      address: "Central Pune",
      description: "Older and cheaper than FC Road, for festival shopping and everyday basics alike.",
    },
    {
      category: "Market",
      name: "MG Road, Camp",
      address: "Camp, Central Pune",
      description: "Pune's Camp area — brand stores and old bakeries on one walkable stretch.",
    },
    {
      category: "Station",
      name: "Pune Junction",
      address: "Central Pune",
      description: "The city's main railway station — also where most long-distance state buses cluster nearby.",
    },
    {
      category: "Park",
      name: "Rajiv Gandhi Zoological Park (Katraj)",
      address: "Katraj, South Pune",
      description: "Zoo, snake park and rescue centre in one, on Pune's southern edge. A cheap half-day out.",
    },
  ],

  Ahmedabad: [
    {
      category: "Tourist Place",
      name: "Sabarmati Ashram",
      address: "Ashram Road, Sabarmati",
      description: "Gandhi's riverside home for over a decade, now a free museum. Quiet, and genuinely moving.",
      featured: true,
    },
    {
      category: "Mosque",
      name: "Sidi Saiyyed Mosque",
      address: "Lal Darwaja, Old City",
      description: "Famous for one thing: the carved stone jali lattice windows that are practically the city's logo.",
    },
    {
      category: "Mosque",
      name: "Jama Masjid, Ahmedabad",
      address: "Manek Chowk, Old City",
      description: "A 15th-century mosque in yellow sandstone, a short walk from Manek Chowk's evening food stalls.",
    },
    {
      category: "Nearby Attraction",
      name: "Adalaj Stepwell",
      address: "Adalaj, ~18 km north of Ahmedabad",
      description: "A five-storey stepwell carved with intricate stonework — cooler underground than the city above it.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Kankaria Lake",
      address: "Maninagar, Ahmedabad",
      description: "A circular lake with a walking promenade, toy train and zoo. Best around sunset with the whole city out.",
    },
    {
      category: "Tourist Place",
      name: "Calico Museum of Textiles",
      address: "Sabarmati",
      description: "One of the world's best textile collections, in an old haveli. Free, but book the guided slot ahead.",
    },
    {
      category: "Nearby Attraction",
      name: "Akshardham Temple, Gandhinagar",
      address: "Gandhinagar, ~25 km from Ahmedabad",
      description: "The original Akshardham, before Delhi's. Vast, marble, and free — phones stay in lockers at the gate.",
    },
    {
      category: "Street Food",
      name: "Manek Chowk",
      address: "Old City, Ahmedabad",
      description: "A jewellery market by day, a food street by night — the city's best-known place to eat standing up.",
      featured: true,
    },
    {
      category: "Street Food",
      name: "Das Khaman House",
      address: "Khadia, Old City",
      description: "Just khaman, done one way, for decades. Go before 10am — it sells out and shuts for the day.",
    },
    {
      category: "Restaurant",
      name: "Agashiye, House of MG",
      address: "Old City, Ahmedabad",
      description: "A rooftop unlimited Gujarati thali in a restored haveli — the occasion option, not the everyday one.",
    },
    {
      category: "Restaurant",
      name: "Gopi Dining Hall",
      address: "Ellis Bridge",
      description: "A no-frills unlimited thali since the 1960s — the everyday option most students actually use.",
    },
    {
      category: "Market",
      name: "Law Garden Night Market",
      address: "Law Garden, Ellis Bridge",
      description: "Embroidery, mirror-work and garba wear laid out on the pavement every evening. Bargain hard.",
    },
    {
      category: "Market",
      name: "C.G. Road",
      address: "Navrangpura",
      description: "Ahmedabad's mainstream shopping strip — brand stores, food chains and a cafe on every corner.",
    },
    {
      category: "Station",
      name: "Ahmedabad Junction (Kalupur)",
      address: "Kalupur, Old City",
      description: "The city's main railway station, in the old city's northeast corner.",
    },
    {
      category: "Park",
      name: "Sabarmati Riverfront",
      address: "Along the Sabarmati, Ahmedabad",
      description: "A paved promenade on both riverbanks — free, flat, and the default evening walk or run.",
    },
  ],

  Jaipur: [
    {
      category: "Tourist Place",
      name: "Hawa Mahal",
      address: "Badi Choupad, Old City",
      description: "The honeycomb pink-sandstone facade every postcard shows. Best photographed from the tea shop opposite.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Amber Fort",
      address: "Amer, ~11 km from Jaipur",
      description: "The big-ticket fort, with mirror-work halls inside. Go early to beat both the heat and the tour buses.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "City Palace",
      address: "Old City, Jaipur",
      description: "Still partly home to the royal family; the rest is a museum of textiles, arms and manuscripts.",
    },
    {
      category: "Tourist Place",
      name: "Jantar Mantar",
      address: "Old City, next to City Palace",
      description: "A UNESCO-listed open-air observatory of giant stone instruments — the world's largest sundial is here.",
    },
    {
      category: "Nearby Attraction",
      name: "Nahargarh Fort",
      address: "Aravalli Hills, north of Jaipur",
      description: "The fort above the city, best for the sunset view over Jaipur rather than the fort itself.",
    },
    {
      category: "Tourist Place",
      name: "Jal Mahal",
      address: "Man Sagar Lake, Jaipur",
      description: "A palace that appears to float mid-lake — you view it from the bank, since the interior is closed.",
    },
    {
      category: "Temple",
      name: "Birla Mandir, Jaipur",
      address: "Tilak Nagar, Jaipur",
      description: "A white-marble temple lit up at night, an easy stop between the old city and Malviya Nagar.",
    },
    {
      category: "Restaurant",
      name: "Rawat Mishthan Bhandar",
      address: "Sindhi Camp, Jaipur",
      description: "Pyaaz kachori since 1955, eaten standing at the counter. A queue at any hour is normal.",
      featured: true,
    },
    {
      category: "Restaurant",
      name: "Laxmi Misthan Bhandar (LMB)",
      address: "Johari Bazaar, Old City",
      description: "A Jaipur institution for Rajasthani thalis and sweets, right inside the jewellery market.",
    },
    {
      category: "Restaurant",
      name: "Chokhi Dhani",
      address: "Tonk Road, ~20 km from central Jaipur",
      description: "A recreated village resort with an unlimited Rajasthani thali and folk shows — the one splurge night out.",
    },
    {
      category: "Street Food",
      name: "Masala Chowk",
      address: "Near Central Park, Jaipur",
      description: "A council-run food court that gathers the city's street-food stalls into one clean, seated space.",
    },
    {
      category: "Market",
      name: "Johari Bazaar",
      address: "Old City, Jaipur",
      description: "The jewellery and textile bazaar inside the pink city's walls — go for the block-print fabric, not the gold.",
    },
    {
      category: "Market",
      name: "Bapu Bazaar",
      address: "Old City, Jaipur",
      description: "Juttis, mojaris and Jaipuri quilts at student-friendly prices, a short walk from Johari Bazaar.",
    },
    {
      category: "Park",
      name: "Central Park, Jaipur",
      address: "Tonk Road, Jaipur",
      description: "The city's largest park, with a musical fountain and a long jogging track around it.",
    },
    {
      category: "Station",
      name: "Jaipur Junction",
      address: "Central Jaipur",
      description: "The main railway station, a short auto ride from most of the old city's sights.",
    },
  ],

  Lucknow: [
    {
      category: "Tourist Place",
      name: "Bara Imambara",
      address: "Old Lucknow",
      description: "Famous for the Bhool Bhulaiyan — a maze of passages inside the roof. Hire the guide or get lost properly.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Chota Imambara",
      address: "Old Lucknow",
      description: "Smaller and more ornate than Bara Imambara, with chandeliers said to be Belgian crystal.",
    },
    {
      category: "Tourist Place",
      name: "Rumi Darwaza",
      address: "Old Lucknow",
      description: "A 60-foot Awadhi gateway that's become the city's symbol — lit up well after dark.",
    },
    {
      category: "Nearby Attraction",
      name: "The Residency",
      address: "Old Lucknow",
      description: "Ruins from the 1857 siege, left largely as they were. A quieter, more sobering stop than the Imambaras.",
    },
    {
      category: "Nearby Attraction",
      name: "Kukrail Reserve Forest",
      address: "Kukrail, Lucknow outskirts",
      description: "A forest reserve with a gharial rehabilitation centre — an easy half-day out of the old city.",
    },
    {
      category: "Tourist Place",
      name: "Dilkusha Kothi",
      address: "Dilkusha, Lucknow",
      description: "Overgrown ruins of an English-style country house — atmospheric, free, and rarely crowded.",
    },
    {
      category: "Market",
      name: "Hazratganj",
      address: "Central Lucknow",
      description: "The city's main shopping street — a genuine promenade, not just a market, with cafes lining it.",
      featured: true,
    },
    {
      category: "Market",
      name: "Aminabad",
      address: "Old Lucknow",
      description: "Cheaper and denser than Hazratganj — clothes, chikankari and everyday basics.",
    },
    {
      category: "Restaurant",
      name: "Tunday Kababi",
      address: "Aminabad, Old Lucknow",
      description: "The galouti kebab that made Lucknow's food famous, from the same family recipe since 1905.",
      featured: true,
    },
    {
      category: "Restaurant",
      name: "Idris Biryani",
      address: "Chowk, Old Lucknow",
      description: "Awadhi biryani with a following that outlasts the shop's modest seating — takeaway is the norm.",
    },
    {
      category: "Restaurant",
      name: "Ram Asrey",
      address: "Chowk, Old Lucknow",
      description: "A sweet shop since 1805, best known for its malai makkhan and thandai in winter.",
    },
    {
      category: "Street Food",
      name: "Chowk",
      address: "Old Lucknow",
      description: "The old city's food lane — kebabs, kulfi and chaat stalls packed into a few hundred metres.",
    },
    {
      category: "Park",
      name: "Ambedkar Memorial Park",
      address: "Vipin Khand, Gomti Nagar",
      description: "A vast sandstone memorial park — more architecture than greenery, but worth the walk.",
    },
    {
      category: "Park",
      name: "Lucknow Zoo (Prince of Wales Zoological Gardens)",
      address: "Kaiserbagh, Lucknow",
      description: "The city zoo, right by the state museum — a cheap, shaded few hours.",
    },
    {
      category: "Station",
      name: "Charbagh Railway Station",
      address: "Charbagh, Lucknow",
      description: "The Mughal-and-Rajput-domed station building is itself worth a look on your way through.",
    },
  ],

  Chandigarh: [
    {
      category: "Tourist Place",
      name: "Rock Garden",
      address: "Sector 1, Chandigarh",
      description: "Nek Chand's sculpture garden built entirely from industrial and household waste. Genuinely unlike anywhere else.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Sukhna Lake",
      address: "Sector 1, Chandigarh",
      description: "The city's default evening spot — a promenade lake with boating and a walking track around it.",
      featured: true,
    },
    {
      category: "Park",
      name: "Zakir Hussain Rose Garden",
      address: "Sector 16, Chandigarh",
      description: "Asia's largest rose garden by most counts — go in the February–March bloom for the annual festival.",
    },
    {
      category: "Tourist Place",
      name: "Capitol Complex",
      address: "Sector 1, Chandigarh",
      description: "Le Corbusier's UNESCO-listed government buildings — the Open Hand Monument is the one everyone photographs.",
    },
    {
      category: "Shopping",
      name: "Elante Mall",
      address: "Industrial Area Phase I",
      description: "North India's largest mall when it opened — the multiplex and food court are the usual student draw.",
    },
    {
      category: "Market",
      name: "Sector 17 Plaza",
      address: "Sector 17, Chandigarh",
      description: "The planned city's original central market — pedestrian, fountain in the middle, shops all around it.",
    },
    {
      category: "Market",
      name: "Sector 15 Market",
      address: "Sector 15, Chandigarh",
      description: "Right by Panjab University — the student market for stationery, food and everyday errands.",
    },
    {
      category: "Nearby Attraction",
      name: "Pinjore Gardens (Yadavindra Gardens)",
      address: "Pinjore, ~20 km from Chandigarh",
      description: "Mughal terraced gardens with fountains — a common half-day trip, especially with visiting family.",
    },
    {
      category: "Nearby Attraction",
      name: "Kasauli",
      address: "~65 km from Chandigarh",
      description: "A small colonial hill town in the Shivaliks — the classic weekend escape from Chandigarh's heat.",
      featured: true,
    },
    {
      category: "Nearby Attraction",
      name: "Chhatbir Zoo",
      address: "Chhatbir, ~20 km from Chandigarh",
      description: "Punjab's main zoo, with a safari section — an easy day trip when Sukhna Lake gets old.",
    },
    {
      category: "Restaurant",
      name: "Pal Dhaba",
      address: "Sector 28, Chandigarh",
      description: "A dhaba-turned-institution near PU that's been feeding students butter-heavy dal and parathas for decades.",
      featured: true,
    },
    {
      category: "Restaurant",
      name: "Sindhi Sweets",
      address: "Sector 22, Chandigarh",
      description: "Chaat and sweets across several branches — the chole bhature is the one people queue for.",
    },
    {
      category: "Cafe",
      name: "Backpackers Cafe",
      address: "Sector 26, Chandigarh",
      description: "A budget cafe near the grain market that's become a regular student hangout for cheap all-day breakfasts.",
    },
    {
      category: "Park",
      name: "Leisure Valley",
      address: "Running through Sectors 3 to 10",
      description: "A chain of connected gardens threading through the city — free, green, and good for a long walk.",
    },
    {
      category: "Station",
      name: "Chandigarh Railway Station",
      address: "Sector 17, Chandigarh (station itself in Sector 25 area)",
      description: "The city's railway station — most students actually arrive via the ISBT bus terminal in Sector 17 instead.",
    },
  ],

  Indore: [
    {
      category: "Tourist Place",
      name: "Rajwada Palace",
      address: "Old City, Indore",
      description: "The Holkar dynasty's seven-storey palace gate facing the main square — free to walk up to at any hour.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Lal Bagh Palace",
      address: "Lal Bagh, Indore",
      description: "A European-style palace built by the Holkars, with gates modelled on Buckingham Palace's.",
    },
    {
      category: "Street Food",
      name: "Sarafa Bazaar",
      address: "Old City, Indore",
      description: "A jewellery market by day that turns into India's most famous night food street after 9pm. Come hungry.",
      featured: true,
    },
    {
      category: "Street Food",
      name: "Chappan Dukan (56 Dukan)",
      address: "New Palasia, Indore",
      description: "56 shops in a row, each doing one snack well. The daytime counterpart to Sarafa's night market.",
      featured: true,
    },
    {
      category: "Temple",
      name: "Kanch Mandir (Glass Temple)",
      address: "Itwaria Bazaar, Indore",
      description: "A Jain temple with walls, ceilings and floors entirely in glass and mirror-work. Ten minutes, genuinely striking.",
    },
    {
      category: "Temple",
      name: "Khajrana Ganesh Temple",
      address: "Khajrana, Indore",
      description: "The city's most-visited temple — Wednesdays draw the biggest crowds.",
    },
    {
      category: "Nearby Attraction",
      name: "Patalpani Waterfall",
      address: "~35 km from Indore",
      description: "A monsoon-season waterfall trip on the Mhow line — best July to September, thin the rest of the year.",
    },
    {
      category: "Nearby Attraction",
      name: "Mandu",
      address: "~95 km from Indore",
      description: "A ruined 15th-century fort city sprawled across a plateau — the standard weekend trip from Indore.",
      featured: true,
    },
    {
      category: "Street Food",
      name: "Johnny Hot Dog",
      address: "Chappan Dukan, Indore",
      description: "Not an actual hot dog — Indore's own bread-and-vegetable snack invention, and a Chappan Dukan icon.",
    },
    {
      category: "Market",
      name: "Vijay Chowk / Race Course Road",
      address: "Race Course Road, Indore",
      description: "A newer shopping strip of showrooms and cafes, alongside the older bazaars downtown.",
    },
    {
      category: "Market",
      name: "Vijay Nagar",
      address: "Vijay Nagar, Indore",
      description: "Indore's mall-and-cafe district — the modern counterpart to the old city's bazaars.",
    },
    {
      category: "Park",
      name: "Regional Park (Nehru Park)",
      address: "Central Indore",
      description: "A central green space with a musical fountain, popular for evening walks.",
    },
    {
      category: "Park",
      name: "Pipliyapala Regional Park",
      address: "Bengali Square, Indore",
      description: "A lakeside park with a musical fountain and boating — bigger and quieter than the city-centre park.",
    },
    {
      category: "Tourist Place",
      name: "Central Museum, Indore",
      address: "Old City, Indore",
      description: "A modest but well-kept museum of Holkar-era sculpture and coins, worth an hour if you're already downtown.",
    },
    {
      category: "Station",
      name: "Indore Junction",
      address: "Central Indore",
      description: "The city's main railway station, a short ride from both Rajwada and Sarafa Bazaar.",
    },
  ],

  Nagpur: [
    {
      category: "Tourist Place",
      name: "Deekshabhoomi",
      address: "Nagpur",
      description: "The vast stupa where Dr. Ambedkar and half a million followers converted to Buddhism in 1956 — a major pilgrimage site.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Sitabuldi Fort",
      address: "Sitabuldi, Central Nagpur",
      description: "A hilltop British-era fort still used by the army — open to visitors only on Independence and Republic Day.",
    },
    {
      category: "Tourist Place",
      name: "Futala Lake",
      address: "Futala, West Nagpur",
      description: "A lakefront promenade that fills up with food stalls and boat rides every evening.",
      featured: true,
    },
    {
      category: "Nearby Attraction",
      name: "Ramtek",
      address: "~50 km from Nagpur",
      description: "A hilltop fort-temple town linked to the Ramayana — a common day trip out of the city.",
    },
    {
      category: "Tourist Place",
      name: "Zero Mile Marker",
      address: "Central Nagpur",
      description: "The stone obelisk marking the geographical centre of undivided India — a quick, odd little stop.",
    },
    {
      category: "Park",
      name: "Ambazari Lake and Garden",
      address: "Ambazari, West Nagpur",
      description: "Nagpur's biggest lake and green space, popular for evening walks and boating alike.",
    },
    {
      category: "Temple",
      name: "Dragon Palace Temple",
      address: "Kamptee, ~15 km from Nagpur",
      description: "A Japanese-style Buddhist temple and garden, quieter and less crowded than Deekshabhoomi.",
    },
    {
      category: "Restaurant",
      name: "Bunty Saoji",
      address: "Central Nagpur",
      description: "Nagpur's fiery Saoji mutton curry, the local specialty — go with a high spice tolerance and cold buttermilk on hand.",
      featured: true,
    },
    {
      category: "Restaurant",
      name: "Haldiram's",
      address: "Sitabuldi, Central Nagpur",
      description: "The chain's original Nagpur shop, still selling the same sweets and namkeen that built the brand.",
    },
    {
      category: "Street Food",
      name: "Central Bazaar Tarri Poha Stalls",
      address: "Central Bazaar Road, Nagpur",
      description: "Tarri poha — flattened rice drowned in spiced gravy — is Nagpur's standard breakfast, eaten on the street.",
    },
    {
      category: "Market",
      name: "Sitabuldi Market",
      address: "Sitabuldi, Central Nagpur",
      description: "The city's main commercial hub — clothes, electronics and everyday shopping in one crowded stretch.",
    },
    {
      category: "Market",
      name: "Sadar Market",
      address: "Sadar, Nagpur",
      description: "An older cantonment-area market, calmer than Sitabuldi and closer to several campuses.",
    },
    {
      category: "Park",
      name: "Maharajbagh Zoo",
      address: "Central Avenue, Nagpur",
      description: "A small, old zoo attached to the agricultural college — cheap and easy for a short break.",
    },
    {
      category: "Park",
      name: "Seminary Hills",
      address: "North Nagpur",
      description: "A hill park with a Ganesh temple at the top and one of the better views over the city.",
    },
    {
      category: "Station",
      name: "Nagpur Junction",
      address: "Central Nagpur",
      description: "A major rail junction on the Delhi–Chennai and Mumbai–Kolkata lines — most students pass through here.",
    },
  ],

  Kota: [
    {
      category: "Tourist Place",
      name: "Chambal Garden",
      address: "Along the Chambal River, Kota",
      description: "A riverside garden with boating — the standard break from coaching-class routine on a free evening.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Kota Barrage",
      address: "Kota",
      description: "One of Asia's largest barrages on the Chambal, lit up at night — best seen from Chambal Garden nearby.",
    },
    {
      category: "Tourist Place",
      name: "City Palace and Fort, Kota",
      address: "Old City, Kota",
      description: "A sprawling riverside fort-palace complex, part still occupied, part open as a museum.",
    },
    {
      category: "Tourist Place",
      name: "Jag Mandir",
      address: "Kishore Sagar, Kota",
      description: "A small island palace sitting in the middle of Kishore Sagar lake, a short walk from the fort.",
    },
    {
      category: "Park",
      name: "Kishore Sagar Talab",
      address: "Central Kota",
      description: "The lake Jag Mandir sits in — a walkable promenade around it, popular in the evenings.",
    },
    {
      category: "Park",
      name: "Seven Wonders Park",
      address: "Kota",
      description: "Scaled-down replicas of the world's seven wonders in one park — an easy, cheap couple of hours.",
    },
    {
      category: "Temple",
      name: "Godavari Dham Temple",
      address: "Kota",
      description: "A large, modern temple complex that's become a regular weekend visit for the city's coaching-student crowd.",
    },
    {
      category: "Nearby Attraction",
      name: "Alniya Waterfall",
      address: "~50 km from Kota",
      description: "A monsoon-fed waterfall trip — worth it July through September, dry the rest of the year.",
    },
    {
      category: "Nearby Attraction",
      name: "Darrah National Park",
      address: "~50 km from Kota",
      description: "A wildlife sanctuary in the hills south of the city — safaris need advance booking.",
    },
    {
      category: "Tourist Place",
      name: "Umed Bhawan Palace",
      address: "Kota",
      description: "A late-19th-century palace, now partly a heritage hotel and museum — a quieter alternative to the main fort.",
    },
    {
      category: "Restaurant",
      name: "Vijay Sweets",
      address: "Kota",
      description: "A long-running local sweets-and-snacks chain — the reliable choice on a coaching schedule with little time.",
    },
    {
      category: "Street Food",
      name: "Kota Kachori Stalls, Nayapura",
      address: "Nayapura, Kota",
      description: "Kota's own pyaaz kachori, sold hot off the pan at stalls that fill up every evening.",
    },
    {
      category: "Market",
      name: "Talwandi Market",
      address: "Talwandi, Kota",
      description: "The commercial heart of Kota's coaching-hostel belt — stationery, food and every student errand in one area.",
      featured: true,
    },
    {
      category: "Market",
      name: "Chawni Bazaar",
      address: "Chawni, Old City, Kota",
      description: "An older, cheaper bazaar in the city centre for clothes and everyday basics.",
    },
    {
      category: "Station",
      name: "Kota Junction",
      address: "Central Kota",
      description: "A major stop on the Delhi–Mumbai line, and how most students arrive in the city each term.",
    },
  ],

  Dehradun: [
    {
      category: "Tourist Place",
      name: "Forest Research Institute (FRI)",
      address: "Kaulagarh Road, Dehradun",
      description: "A colonial-era building the size of a palace, with a natural-history museum inside — free-flowing lawns are the real draw.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Robber's Cave (Gucchupani)",
      address: "Anarwala, Dehradun",
      description: "A shallow cave stream you wade through barefoot — the standard first-weekend trip for anyone new to the city.",
      featured: true,
    },
    {
      category: "Nearby Attraction",
      name: "Sahastradhara",
      address: "~14 km from Dehradun",
      description: "Sulphur springs said to be good for the skin — go for the setting more than any claimed cure.",
    },
    {
      category: "Temple",
      name: "Tapkeshwar Temple",
      address: "Along the Tons River, Dehradun",
      description: "A cave temple where water drips naturally onto a Shiva lingam — busiest during Shivratri.",
    },
    {
      category: "Tourist Place",
      name: "Mindrolling Monastery",
      address: "Clement Town, Dehradun",
      description: "A Buddhist monastery with the Great Stupa, one of the tallest in the world — calm, and rarely crowded.",
    },
    {
      category: "Nearby Attraction",
      name: "Rajaji National Park",
      address: "Southeast of Dehradun",
      description: "Elephant and tiger territory bordering the city — safaris need a permit booked a day ahead.",
    },
    {
      category: "Nearby Attraction",
      name: "Mussoorie",
      address: "~35 km from Dehradun",
      description: "The hill station above Dehradun — Mall Road and Kempty Falls are the classic weekend loop.",
      featured: true,
    },
    {
      category: "Market",
      name: "Paltan Bazaar",
      address: "Central Dehradun",
      description: "The city's main shopping street, from clothes to electronics, a short walk from the railway station.",
    },
    {
      category: "Cafe",
      name: "Kalsang Friend's Corner",
      address: "Clement Town, Dehradun",
      description: "Tibetan momos and thukpa near the monastery — a longstanding student favourite.",
    },
    {
      category: "Restaurant",
      name: "Motimahal Delux",
      address: "Rajpur Road, Dehradun",
      description: "A long-running multi-cuisine restaurant on Dehradun's main road — the reliable group-dinner option.",
    },
    {
      category: "Library",
      name: "Doon Library and Research Centre",
      address: "Dalanwala, Dehradun",
      description: "A well-stocked public reading room and reference library — a real option when the hostel is too loud.",
    },
    {
      category: "Station",
      name: "Dehradun Railway Station",
      address: "Central Dehradun",
      description: "The end of the line from Delhi and Haridwar — most students arrive here or by the Delhi highway buses.",
    },
    {
      category: "Tourist Place",
      name: "Clock Tower (Ghanta Ghar)",
      address: "Central Dehradun",
      description: "The city's central landmark and traffic circle — everything downtown is given as a distance from here.",
    },
    {
      category: "Nearby Attraction",
      name: "Lachhiwala",
      address: "~22 km from Dehradun",
      description: "A river picnic spot with natural pools, popular for a day out without the Mussoorie crowds.",
    },
    {
      category: "Park",
      name: "Malsi Deer Park",
      address: "Mussoorie Road, Dehradun",
      description: "A small zoo and deer park at the base of the Mussoorie hill road — an easy stop on the way up or down.",
    },
  ],

  Bhopal: [
    {
      category: "Tourist Place",
      name: "Upper Lake (Bhoj Wetland)",
      address: "Bhopal",
      description: "One of Asia's largest artificial lakes, with the city built around it — boating and the promenade are the draw.",
      featured: true,
    },
    {
      category: "Mosque",
      name: "Taj-ul-Masajid",
      address: "Old City, Bhopal",
      description: "One of India's largest mosques, with pink minarets and a vast courtyard — non-prayer hours are open to visit.",
      featured: true,
    },
    {
      category: "Nearby Attraction",
      name: "Van Vihar National Park",
      address: "Bhopal",
      description: "A wildlife sanctuary right at the edge of Upper Lake — a rare national park inside a state capital.",
    },
    {
      category: "Tourist Place",
      name: "Bharat Bhavan",
      address: "Shamla Hills, Bhopal",
      description: "A multi-arts centre for tribal and contemporary art, theatre and poetry — Charles Correa's best-known building here.",
    },
    {
      category: "Nearby Attraction",
      name: "Sanchi Stupa",
      address: "~45 km from Bhopal",
      description: "A UNESCO World Heritage Buddhist stupa from the 3rd century BCE — the standard day trip from Bhopal.",
      featured: true,
    },
    {
      category: "Nearby Attraction",
      name: "Bhimbetka Rock Shelters",
      address: "~45 km from Bhopal",
      description: "Prehistoric cave paintings, some over 10,000 years old — a UNESCO site combinable with Sanchi in one trip.",
    },
    {
      category: "Temple",
      name: "Birla Mandir, Bhopal",
      address: "Arera Hills, Bhopal",
      description: "A hilltop temple with a wide view over the Upper Lake — quieter than the big-city Birla temples elsewhere.",
    },
    {
      category: "Street Food",
      name: "Chatori Gali",
      address: "New Market, Bhopal",
      description: "A dedicated food lane in New Market — chaat, kebabs and the city's street-food reputation in one stretch.",
    },
    {
      category: "Restaurant",
      name: "Bapu Ki Kutiya",
      address: "New Market, Bhopal",
      description: "Poha-jalebi for breakfast, a Bhopal ritual, served here since long before it was fashionable.",
      featured: true,
    },
    {
      category: "Restaurant",
      name: "Manohar Dairy and Restaurant",
      address: "New Market, Bhopal",
      description: "Another of the city's go-to poha-jalebi spots, usually with a shorter queue than Bapu Ki Kutiya.",
    },
    {
      category: "Market",
      name: "New Market",
      address: "TT Nagar, Bhopal",
      description: "One of the oldest planned markets in India — shops, food and the Chatori Gali lane all together.",
    },
    {
      category: "Market",
      name: "MP Nagar",
      address: "MP Nagar, Bhopal",
      description: "The newer commercial district — malls, chain restaurants and most of the city's nightlife.",
    },
    {
      category: "Tourist Place",
      name: "Shaurya Smarak",
      address: "Arera Hills, Bhopal",
      description: "A war memorial with an eternal flame and a museum, next to Birla Mandir on the same hill.",
    },
    {
      category: "Park",
      name: "Lower Lake",
      address: "Bhopal",
      description: "The smaller of the city's twin lakes, with a walkway (the Bridge of Ideas) connecting to the Upper Lake side.",
    },
    {
      category: "Station",
      name: "Rani Kamlapati Railway Station",
      address: "Bhopal",
      description: "The city's modern main station (formerly Habibganj) — most trains in and out of Bhopal stop here.",
    },
  ],

  Vadodara: [
    {
      category: "Tourist Place",
      name: "Laxmi Vilas Palace",
      address: "Vadodara",
      description: "One of India's largest private residences, still home to the Gaekwad royal family — part is open as a museum.",
      featured: true,
    },
    {
      category: "Park",
      name: "Sayaji Baug (Kamati Baug)",
      address: "Central Vadodara",
      description: "A huge central garden with a zoo, planetarium and the Baroda Museum all inside it.",
      featured: true,
    },
    {
      category: "Tourist Place",
      name: "Sursagar Lake",
      address: "Old City, Vadodara",
      description: "A central lake with a giant Shiva statue rising from the water, lit up in the evenings.",
    },
    {
      category: "Tourist Place",
      name: "Baroda Museum and Picture Gallery",
      address: "Sayaji Baug, Vadodara",
      description: "An Egyptian mummy and a European art collection, inside Sayaji Baug — an easy add to the same visit.",
    },
    {
      category: "Temple",
      name: "EME Temple",
      address: "Vadodara",
      description: "A striking fibreglass-domed temple built by army engineers — unlike any other temple architecture in the country.",
    },
    {
      category: "Nearby Attraction",
      name: "Champaner-Pavagadh",
      address: "~45 km from Vadodara",
      description: "A UNESCO World Heritage archaeological park — a hilltop temple, mosque ruins and a fort in one trip.",
      featured: true,
    },
    {
      category: "Nearby Attraction",
      name: "Statue of Unity",
      address: "~90 km from Vadodara",
      description: "The world's tallest statue, of Sardar Patel — a full day trip, best booked online ahead for the viewing gallery.",
    },
    {
      category: "Tourist Place",
      name: "Nyay Mandir",
      address: "Mandvi, Old City, Vadodara",
      description: "A Gaekwad-era clock tower and court building at the centre of the old walled city.",
    },
    {
      category: "Tourist Place",
      name: "Kirti Mandir",
      address: "Vadodara",
      description: "The Gaekwad family's cenotaph complex, with murals by Nandalal Bose inside.",
    },
    {
      category: "Street Food",
      name: "Panchvati Gathiya",
      address: "Vadodara",
      description: "The city's best-known gathiya — a fried gram-flour snack eaten for breakfast with fafda and chutney.",
    },
    {
      category: "Restaurant",
      name: "Mandap Restaurant",
      address: "Vadodara",
      description: "An unlimited Gujarati thali spot popular with students for the price-to-food ratio.",
    },
    {
      category: "Market",
      name: "Sardar Bazaar",
      address: "Old City, Vadodara",
      description: "A dense, old-city market for clothes, utensils and everyday basics.",
    },
    {
      category: "Shopping",
      name: "Inorbit Mall Vadodara",
      address: "Vadodara",
      description: "The city's main mall — multiplex, food court and brand stores for a rainy-day plan.",
    },
    {
      category: "Park",
      name: "Ajwa Nimeta Garden",
      address: "Ajwa, ~20 km from Vadodara",
      description: "A musical fountain garden by the Ajwa reservoir — a common weekend-evening drive out of the city.",
    },
    {
      category: "Station",
      name: "Vadodara Junction",
      address: "Central Vadodara",
      description: "A major stop on the Delhi–Mumbai line, and the busiest station between the two cities.",
    },
  ],

  Coimbatore: [
    {
      category: "Temple",
      name: "Marudamalai Temple",
      address: "Marudamalai, Coimbatore",
      description: "A hilltop Murugan temple with a wide view over the city — a short climb or a ghat road drive up.",
      featured: true,
    },
    {
      category: "Park",
      name: "VOC Park and Zoo",
      address: "Central Coimbatore",
      description: "A central park with a small zoo and a miniature train — a cheap, easy evening in the middle of the city.",
    },
    {
      category: "Temple",
      name: "Perur Pateeswarar Temple",
      address: "Perur, Coimbatore",
      description: "An old Shiva temple on the Noyyal riverbank, known for its intricate stone and wood carving.",
    },
    {
      category: "Nearby Attraction",
      name: "Black Thunder",
      address: "Mettupalayam Road, ~30 km from Coimbatore",
      description: "A water and amusement theme park — the standard group outing when everyone wants a full day off campus.",
    },
    {
      category: "Nearby Attraction",
      name: "Siruvani Waterfalls",
      address: "~35 km from Coimbatore",
      description: "Falls fed by water said to be among the sweetest in the country — a popular day trip toward the Western Ghats.",
      featured: true,
    },
    {
      category: "Nearby Attraction",
      name: "Isha Yoga Center (Adiyogi)",
      address: "Velliangiri foothills, ~30 km from Coimbatore",
      description: "Home to the 112-foot Adiyogi Shiva statue — open to visitors regardless of the yoga programs.",
    },
    {
      category: "Nearby Attraction",
      name: "Kovai Kutralam Falls",
      address: "~40 km from Coimbatore",
      description: "A smaller, less crowded falls than Siruvani, near the Siruvani route — best in the post-monsoon months.",
    },
    {
      category: "Tourist Place",
      name: "Gedee Car Museum",
      address: "Coimbatore",
      description: "A private vintage and classic car collection — an unusual, low-key couple of hours.",
    },
    {
      category: "Market",
      name: "RS Puram",
      address: "RS Puram, Coimbatore",
      description: "Coimbatore's main shopping and eating-out district — sarees, gold and a cafe on every street.",
    },
    {
      category: "Market",
      name: "Oppanakara Street",
      address: "Town Hall area, Coimbatore",
      description: "An old-city street of textile and general-goods shops — cheaper than RS Puram for everyday buys.",
    },
    {
      category: "Restaurant",
      name: "Annapoorna",
      address: "Coimbatore (multiple branches)",
      description: "A South Indian vegetarian chain that started in Coimbatore — the reliable, familiar option for a group meal.",
    },
    {
      category: "Restaurant",
      name: "Sri Krishna Sweets",
      address: "Coimbatore (multiple branches)",
      description: "A well-known Tamil Nadu sweets-and-snacks chain, good for gifting or a quick festive craving.",
    },
    {
      category: "Restaurant",
      name: "Junior Kuppanna",
      address: "Coimbatore (multiple branches)",
      description: "Kongu Nadu-style non-vegetarian meals — the naatu kozhi (country chicken) is what it's known for.",
    },
    {
      category: "Shopping",
      name: "Brookefields Mall",
      address: "Coimbatore",
      description: "One of the city's larger malls — multiplex, food court and brand stores in one place.",
    },
    {
      category: "Station",
      name: "Coimbatore Junction",
      address: "Central Coimbatore",
      description: "The city's main railway station, on the line toward Palakkad and further into Kerala.",
    },
  ],

  Vellore: [
    {
      category: "Tourist Place",
      name: "Vellore Fort",
      address: "Central Vellore",
      description: "A 16th-century fort with a moat still intact, housing a temple, mosque and church inside its walls.",
      featured: true,
    },
    {
      category: "Temple",
      name: "Jalakandeswarar Temple",
      address: "Inside Vellore Fort",
      description: "A Vijayanagara-era Shiva temple within the fort walls, known for its detailed granite carving.",
    },
    {
      category: "Tourist Place",
      name: "Government Museum, Vellore Fort",
      address: "Inside Vellore Fort",
      description: "A small museum of local sculpture and history housed within the fort — an easy add to the same visit.",
    },
    {
      category: "Temple",
      name: "Sripuram Golden Temple",
      address: "Malaikodi, Vellore",
      description: "A Lakshmi Narayani temple covered in gold leaf, set in landscaped grounds — Vellore's best-known student outing.",
      featured: true,
    },
    {
      category: "Nearby Attraction",
      name: "Amirthi Zoological Park",
      address: "~25 km from Vellore",
      description: "A forest zoo and picnic spot in the hills outside the city — a straightforward half-day trip.",
    },
    {
      category: "Nearby Attraction",
      name: "Yelagiri Hills",
      address: "~1 hour from Vellore",
      description: "A small hill station with a lake and rose garden — the standard weekend trip for VIT and CMC students.",
      featured: true,
    },
    {
      category: "Nearby Attraction",
      name: "Vainu Bappu Observatory",
      address: "Kavalur, ~85 km from Vellore",
      description: "India's major optical observatory, on a hilltop near Yelagiri — visits need advance permission.",
    },
    {
      category: "Restaurant",
      name: "Darling Restaurant",
      address: "Vellore",
      description: "A long-standing multi-cuisine restaurant that's become a regular VIT-student hangout for group dinners.",
    },
    {
      category: "Restaurant",
      name: "Hotel Saravana Bhavan",
      address: "Vellore",
      description: "The reliable South Indian vegetarian chain option, for a familiar meal any day of the week.",
    },
    {
      category: "Street Food",
      name: "Chinna Bazaar Street Food",
      address: "Chinna Bazaar, Vellore",
      description: "Evening food stalls in the old market area — quick, cheap eating between classes.",
    },
    {
      category: "Market",
      name: "Vellore Town Market",
      address: "Long Bazaar, Vellore",
      description: "The old town's main market — clothes, groceries and everyday shopping near the fort.",
    },
    {
      category: "Market",
      name: "Sathuvachari Market",
      address: "Sathuvachari, Vellore",
      description: "A residential-area market closer to the CMC and engineering college side of the city.",
    },
    {
      category: "Library",
      name: "Vellore District Central Library",
      address: "Vellore",
      description: "A public reading room and reference library — worth knowing about beyond campus library hours.",
    },
    {
      category: "Station",
      name: "Katpadi Junction",
      address: "Katpadi, Vellore",
      description: "The city's main railway station and the usual arrival point for students coming from Chennai or Bengaluru.",
      featured: true,
    },
  ],

  Manipal: [
    {
      category: "Tourist Place",
      name: "End Point",
      address: "Manipal",
      description: "A cliffside viewpoint over the Western Ghats and the Arabian Sea in the distance — the classic Manipal sunset spot.",
      featured: true,
    },
    {
      category: "Park",
      name: "Manipal Lake",
      address: "Manipal",
      description: "A small lake with pedal boats at the centre of town — an easy, cheap break between classes.",
    },
    {
      category: "Nearby Attraction",
      name: "Malpe Beach",
      address: "~8 km from Manipal",
      description: "The nearest beach, with a working fishing harbour and boats out to St. Mary's Island.",
      featured: true,
    },
    {
      category: "Nearby Attraction",
      name: "St. Mary's Island",
      address: "Boat from Malpe, ~8 km from Manipal",
      description: "Basalt rock columns just offshore — a short, popular boat trip from Malpe, weather permitting.",
    },
    {
      category: "Nearby Attraction",
      name: "Kaup Beach",
      address: "~10 km from Manipal",
      description: "A quieter beach than Malpe, with a lighthouse you can climb for a view down the coast.",
    },
    {
      category: "Temple",
      name: "Sri Krishna Matha, Udupi",
      address: "Udupi, ~5 km from Manipal",
      description: "The centuries-old Krishna temple at the heart of Udupi — also where the region's cuisine takes its name from.",
    },
    {
      category: "Tourist Place",
      name: "Hasta Shilpa Heritage Village",
      address: "Manipal outskirts",
      description: "A crafts and heritage-architecture museum with relocated traditional houses from across India.",
    },
    {
      category: "Nearby Attraction",
      name: "Someshwara Beach",
      address: "Near Udupi, ~8 km from Manipal",
      description: "A rockier, less crowded beach with striking sunset views, popular with students wanting a quieter option than Malpe.",
    },
    {
      category: "Market",
      name: "Tiger Circle",
      address: "Manipal",
      description: "The commercial centre of student Manipal — stationery, phone repairs and food all within a few minutes' walk.",
      featured: true,
    },
    {
      category: "Restaurant",
      name: "Woodside",
      address: "Manipal",
      description: "A multi-cuisine restaurant near campus that's a long-running MAHE-student hangout for group meals.",
    },
    {
      category: "Cafe",
      name: "Base Camp Cafe",
      address: "Manipal",
      description: "A cafe geared toward the town's trekking and adventure-sports crowd — coffee and comfort food between hikes.",
    },
    {
      category: "Shopping",
      name: "Empire Mall",
      address: "Manipal",
      description: "The town's main mall, with a multiplex — the default rainy-day plan.",
    },
    {
      category: "Nearby Attraction",
      name: "Big Splash Water Theme Park",
      address: "Near Manipal",
      description: "A water park a short ride from campus — a common weekend group outing.",
    },
    {
      category: "Station",
      name: "Udupi Railway Station",
      address: "Udupi, ~5 km from Manipal",
      description: "The nearest railway station to Manipal, on the Konkan Railway line along the coast.",
    },
  ],
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  await mongoose.connect(uri);

  let total = 0;
  let created = 0;

  for (const [city, seeds] of Object.entries(CITY_PLACES)) {
    for (const seed of seeds) {
      total += 1;
      const res = await Place.findOneAndUpdate(
        { city, name: seed.name },
        {
          city,
          category: seed.category,
          name: seed.name,
          address: seed.address,
          description: seed.description,
          featured: seed.featured ?? false,
          mapsLink: maps(seed.name, city),
        },
        { upsert: true, returnDocument: "after", includeResultMetadata: true },
      );
      if (!res.lastErrorObject?.updatedExisting) created += 1;
    }
    console.log(`  ${city}: ${seeds.length}`);
  }

  console.log(`Seeded ${total} places across ${Object.keys(CITY_PLACES).length} cities (${created} new, ${total - created} updated)`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
