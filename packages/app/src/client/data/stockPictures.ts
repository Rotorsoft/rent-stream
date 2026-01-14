export interface StockPicture {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  category: string;
}

// Equipment rental stock images from Unsplash
export const stockPictures: StockPicture[] = [
  // Cameras - DSLR & Mirrorless
  {
    id: "camera-1",
    url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&q=80",
    alt: "Professional DSLR camera",
    category: "Camera",
  },
  {
    id: "camera-2",
    url: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=200&q=80",
    alt: "Vintage film camera",
    category: "Camera",
  },
  {
    id: "camera-3",
    url: "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=200&q=80",
    alt: "Canon DSLR camera",
    category: "Camera",
  },
  {
    id: "camera-4",
    url: "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=200&q=80",
    alt: "Nikon camera body",
    category: "Camera",
  },
  {
    id: "camera-5",
    url: "https://images.unsplash.com/photo-1500634245200-e5245c7574ef?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1500634245200-e5245c7574ef?w=200&q=80",
    alt: "Mirrorless camera setup",
    category: "Camera",
  },
  {
    id: "camera-6",
    url: "https://images.unsplash.com/photo-1552168324-d612d77725e3?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1552168324-d612d77725e3?w=200&q=80",
    alt: "Sony Alpha camera",
    category: "Camera",
  },
  {
    id: "camera-7",
    url: "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=200&q=80",
    alt: "Professional camera kit",
    category: "Camera",
  },
  {
    id: "camera-8",
    url: "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=200&q=80",
    alt: "Camera with lens",
    category: "Camera",
  },

  // Video Cameras
  {
    id: "video-1",
    url: "https://images.unsplash.com/photo-1585634653298-5d5c3c1e2a6e?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1585634653298-5d5c3c1e2a6e?w=200&q=80",
    alt: "Professional video camera",
    category: "Video",
  },
  {
    id: "video-2",
    url: "https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=200&q=80",
    alt: "Cinema camera rig",
    category: "Video",
  },
  {
    id: "video-3",
    url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&q=80",
    alt: "Video production setup",
    category: "Video",
  },
  {
    id: "video-4",
    url: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=200&q=80",
    alt: "Camcorder",
    category: "Video",
  },
  {
    id: "video-5",
    url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=200&q=80",
    alt: "Film camera equipment",
    category: "Video",
  },

  // Lenses
  {
    id: "lens-1",
    url: "https://images.unsplash.com/photo-1606986628253-e91e7035a0c5?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1606986628253-e91e7035a0c5?w=200&q=80",
    alt: "Camera lens collection",
    category: "Lens",
  },
  {
    id: "lens-2",
    url: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=200&q=80",
    alt: "Telephoto lens",
    category: "Lens",
  },
  {
    id: "lens-3",
    url: "https://images.unsplash.com/photo-1495745966610-2a67c30ad2c6?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1495745966610-2a67c30ad2c6?w=200&q=80",
    alt: "Prime lens",
    category: "Lens",
  },
  {
    id: "lens-4",
    url: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=200&q=80",
    alt: "Wide angle lens",
    category: "Lens",
  },
  {
    id: "lens-5",
    url: "https://images.unsplash.com/photo-1609953508128-cc70de50f96f?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1609953508128-cc70de50f96f?w=200&q=80",
    alt: "Macro lens",
    category: "Lens",
  },

  // Tripods & Support
  {
    id: "tripod-1",
    url: "https://images.unsplash.com/photo-1598477564722-eb0b5aa3a5e3?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1598477564722-eb0b5aa3a5e3?w=200&q=80",
    alt: "Professional tripod",
    category: "Tripod",
  },
  {
    id: "tripod-2",
    url: "https://images.unsplash.com/photo-1542567455-cd733f23fbb1?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1542567455-cd733f23fbb1?w=200&q=80",
    alt: "Camera on tripod",
    category: "Tripod",
  },
  {
    id: "tripod-3",
    url: "https://images.unsplash.com/photo-1616423641340-a6a7eb5ed832?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1616423641340-a6a7eb5ed832?w=200&q=80",
    alt: "Video tripod head",
    category: "Tripod",
  },
  {
    id: "gimbal-1",
    url: "https://images.unsplash.com/photo-1598387846148-47e82ee120cc?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1598387846148-47e82ee120cc?w=200&q=80",
    alt: "Camera gimbal stabilizer",
    category: "Stabilizer",
  },
  {
    id: "gimbal-2",
    url: "https://images.unsplash.com/photo-1559838881-36a10a8e3f9d?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1559838881-36a10a8e3f9d?w=200&q=80",
    alt: "Handheld gimbal",
    category: "Stabilizer",
  },

  // Lighting
  {
    id: "lighting-1",
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
    alt: "Studio lighting equipment",
    category: "Lighting",
  },
  {
    id: "lighting-2",
    url: "https://images.unsplash.com/photo-1565206077212-4eb8cbc38e6c?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1565206077212-4eb8cbc38e6c?w=200&q=80",
    alt: "Softbox light",
    category: "Lighting",
  },
  {
    id: "lighting-3",
    url: "https://images.unsplash.com/photo-1533122250115-6bb28e9a48c3?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1533122250115-6bb28e9a48c3?w=200&q=80",
    alt: "Ring light",
    category: "Lighting",
  },
  {
    id: "lighting-4",
    url: "https://images.unsplash.com/photo-1594394748724-e9f0e7a1a2c2?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1594394748724-e9f0e7a1a2c2?w=200&q=80",
    alt: "LED panel light",
    category: "Lighting",
  },
  {
    id: "lighting-5",
    url: "https://images.unsplash.com/photo-1516724562728-afc824a36e84?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1516724562728-afc824a36e84?w=200&q=80",
    alt: "Studio flash",
    category: "Lighting",
  },
  {
    id: "lighting-6",
    url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&q=80",
    alt: "Photography umbrella",
    category: "Lighting",
  },

  // Drones
  {
    id: "drone-1",
    url: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=200&q=80",
    alt: "Aerial drone",
    category: "Drone",
  },
  {
    id: "drone-2",
    url: "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=200&q=80",
    alt: "DJI drone",
    category: "Drone",
  },
  {
    id: "drone-3",
    url: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=200&q=80",
    alt: "Quadcopter drone",
    category: "Drone",
  },
  {
    id: "drone-4",
    url: "https://images.unsplash.com/photo-1524143986875-3b098d78b363?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1524143986875-3b098d78b363?w=200&q=80",
    alt: "Professional drone kit",
    category: "Drone",
  },
  {
    id: "drone-5",
    url: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=200&q=80",
    alt: "Racing drone",
    category: "Drone",
  },

  // Audio Equipment
  {
    id: "audio-1",
    url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&q=80",
    alt: "Professional microphone",
    category: "Audio",
  },
  {
    id: "audio-2",
    url: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=200&q=80",
    alt: "Studio microphone",
    category: "Audio",
  },
  {
    id: "audio-3",
    url: "https://images.unsplash.com/photo-1558537348-c0f8e733989d?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558537348-c0f8e733989d?w=200&q=80",
    alt: "Wireless lavalier mic",
    category: "Audio",
  },
  {
    id: "audio-4",
    url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=200&q=80",
    alt: "Audio mixer",
    category: "Audio",
  },
  {
    id: "audio-5",
    url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=80",
    alt: "Studio headphones",
    category: "Audio",
  },
  {
    id: "audio-6",
    url: "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=200&q=80",
    alt: "Boom microphone",
    category: "Audio",
  },
  {
    id: "audio-7",
    url: "https://images.unsplash.com/photo-1520170350707-b2da59970118?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1520170350707-b2da59970118?w=200&q=80",
    alt: "PA speaker system",
    category: "Audio",
  },
  {
    id: "audio-8",
    url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&q=80",
    alt: "Concert speaker",
    category: "Audio",
  },

  // Computers & Laptops
  {
    id: "laptop-1",
    url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&q=80",
    alt: "Laptop computer",
    category: "Computer",
  },
  {
    id: "laptop-2",
    url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&q=80",
    alt: "MacBook Pro",
    category: "Computer",
  },
  {
    id: "laptop-3",
    url: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=200&q=80",
    alt: "Laptop workstation",
    category: "Computer",
  },
  {
    id: "desktop-1",
    url: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=200&q=80",
    alt: "Desktop computer setup",
    category: "Computer",
  },
  {
    id: "monitor-1",
    url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=200&q=80",
    alt: "Computer monitor",
    category: "Computer",
  },
  {
    id: "tablet-1",
    url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&q=80",
    alt: "iPad tablet",
    category: "Tablet",
  },
  {
    id: "tablet-2",
    url: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=200&q=80",
    alt: "Drawing tablet",
    category: "Tablet",
  },

  // Projectors & Displays
  {
    id: "projector-1",
    url: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=200&q=80",
    alt: "Projector equipment",
    category: "Projector",
  },
  {
    id: "projector-2",
    url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=200&q=80",
    alt: "Cinema projector",
    category: "Projector",
  },
  {
    id: "display-1",
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
    alt: "Large display screen",
    category: "Display",
  },
  {
    id: "tv-1",
    url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=200&q=80",
    alt: "Smart TV",
    category: "Display",
  },

  // Power Tools
  {
    id: "drill-1",
    url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&q=80",
    alt: "Power drill",
    category: "Tool",
  },
  {
    id: "drill-2",
    url: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=200&q=80",
    alt: "Cordless drill set",
    category: "Tool",
  },
  {
    id: "saw-1",
    url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=200&q=80",
    alt: "Circular saw",
    category: "Tool",
  },
  {
    id: "tool-1",
    url: "https://images.unsplash.com/photo-1581147036324-c17ac41f0d20?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1581147036324-c17ac41f0d20?w=200&q=80",
    alt: "Tool set",
    category: "Tool",
  },
  {
    id: "tool-2",
    url: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=200&q=80",
    alt: "Workshop tools",
    category: "Tool",
  },
  {
    id: "sander-1",
    url: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=200&q=80",
    alt: "Electric sander",
    category: "Tool",
  },

  // Construction Equipment
  {
    id: "ladder-1",
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
    alt: "Extension ladder",
    category: "Construction",
  },
  {
    id: "scaffold-1",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=80",
    alt: "Scaffolding",
    category: "Construction",
  },
  {
    id: "generator-1",
    url: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=200&q=80",
    alt: "Portable generator",
    category: "Generator",
  },
  {
    id: "compressor-1",
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
    alt: "Air compressor",
    category: "Construction",
  },

  // Musical Instruments
  {
    id: "guitar-1",
    url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=200&q=80",
    alt: "Electric guitar",
    category: "Music",
  },
  {
    id: "guitar-2",
    url: "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=200&q=80",
    alt: "Acoustic guitar",
    category: "Music",
  },
  {
    id: "keyboard-1",
    url: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=200&q=80",
    alt: "Piano keyboard",
    category: "Music",
  },
  {
    id: "drums-1",
    url: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=200&q=80",
    alt: "Drum kit",
    category: "Music",
  },
  {
    id: "amp-1",
    url: "https://images.unsplash.com/photo-1535587566541-97121a128dc5?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1535587566541-97121a128dc5?w=200&q=80",
    alt: "Guitar amplifier",
    category: "Music",
  },
  {
    id: "dj-1",
    url: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=200&q=80",
    alt: "DJ controller",
    category: "Music",
  },

  // Sports Equipment
  {
    id: "bike-1",
    url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=200&q=80",
    alt: "Mountain bike",
    category: "Sports",
  },
  {
    id: "bike-2",
    url: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=200&q=80",
    alt: "Road bicycle",
    category: "Sports",
  },
  {
    id: "ski-1",
    url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&q=80",
    alt: "Ski equipment",
    category: "Sports",
  },
  {
    id: "kayak-1",
    url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80",
    alt: "Kayak",
    category: "Sports",
  },
  {
    id: "golf-1",
    url: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=200&q=80",
    alt: "Golf clubs",
    category: "Sports",
  },
  {
    id: "tennis-1",
    url: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=200&q=80",
    alt: "Tennis racket",
    category: "Sports",
  },

  // Camping & Outdoor
  {
    id: "tent-1",
    url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200&q=80",
    alt: "Camping tent",
    category: "Camping",
  },
  {
    id: "tent-2",
    url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=200&q=80",
    alt: "Large event tent",
    category: "Camping",
  },
  {
    id: "backpack-1",
    url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&q=80",
    alt: "Hiking backpack",
    category: "Camping",
  },
  {
    id: "cooler-1",
    url: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=200&q=80",
    alt: "Cooler box",
    category: "Camping",
  },
  {
    id: "grill-1",
    url: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=200&q=80",
    alt: "Portable grill",
    category: "Camping",
  },

  // Party & Event Equipment
  {
    id: "party-1",
    url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=200&q=80",
    alt: "Party decorations",
    category: "Party",
  },
  {
    id: "party-2",
    url: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=200&q=80",
    alt: "Party lights",
    category: "Party",
  },
  {
    id: "table-1",
    url: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&q=80",
    alt: "Folding tables",
    category: "Furniture",
  },
  {
    id: "chair-1",
    url: "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1503602642458-232111445657?w=200&q=80",
    alt: "Event chairs",
    category: "Furniture",
  },
  {
    id: "stage-1",
    url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&q=80",
    alt: "Stage platform",
    category: "Event",
  },

  // Office Equipment
  {
    id: "printer-1",
    url: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=200&q=80",
    alt: "Office printer",
    category: "Office",
  },
  {
    id: "scanner-1",
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
    alt: "Document scanner",
    category: "Office",
  },
  {
    id: "shredder-1",
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
    alt: "Paper shredder",
    category: "Office",
  },

  // VR/AR Equipment
  {
    id: "vr-1",
    url: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=200&q=80",
    alt: "VR headset",
    category: "VR",
  },
  {
    id: "vr-2",
    url: "https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=200&q=80",
    alt: "Virtual reality kit",
    category: "VR",
  },

  // Gaming
  {
    id: "gaming-1",
    url: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=200&q=80",
    alt: "Gaming console",
    category: "Gaming",
  },
  {
    id: "gaming-2",
    url: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=200&q=80",
    alt: "Gaming controller",
    category: "Gaming",
  },
  {
    id: "gaming-3",
    url: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=200&q=80",
    alt: "Gaming setup",
    category: "Gaming",
  },

  // Medical/Safety Equipment
  {
    id: "safety-1",
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
    alt: "Safety helmet",
    category: "Safety",
  },
  {
    id: "firstaid-1",
    url: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=200&q=80",
    alt: "First aid kit",
    category: "Safety",
  },

  // Cleaning Equipment
  {
    id: "vacuum-1",
    url: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=200&q=80",
    alt: "Industrial vacuum",
    category: "Cleaning",
  },
  {
    id: "pressure-1",
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
    alt: "Pressure washer",
    category: "Cleaning",
  },

  // Kitchen Equipment
  {
    id: "kitchen-1",
    url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&q=80",
    alt: "Commercial mixer",
    category: "Kitchen",
  },
  {
    id: "kitchen-2",
    url: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=200&q=80",
    alt: "Coffee machine",
    category: "Kitchen",
  },
  {
    id: "kitchen-3",
    url: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=200&q=80",
    alt: "Blender",
    category: "Kitchen",
  },

  // Miscellaneous
  {
    id: "misc-1",
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
    alt: "Storage container",
    category: "Storage",
  },
  {
    id: "misc-2",
    url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&q=80",
    alt: "Hand truck dolly",
    category: "Transport",
  },
  {
    id: "misc-3",
    url: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=200&q=80",
    alt: "Portable heater",
    category: "Climate",
  },
  {
    id: "misc-4",
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
    alt: "Portable fan",
    category: "Climate",
  },
];
