/**
 * Loads the Explore page with places and eateries for the six biggest campus cities — the
 * things a student who just moved somewhere unfamiliar would want to find first.
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
