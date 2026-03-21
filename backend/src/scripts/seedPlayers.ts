import { prisma } from "../db";
import "dotenv/config";

const players = [
  // ==============================
  // 2 CR BRACKET (Elite International / Marquee)
  // ==============================
  { name: "Virat Kohli", role: "Batsman", team: "RCB", basePrice: 2.00 },
  { name: "Rohit Sharma", role: "Batsman", team: "MI", basePrice: 2.00 },
  { name: "Suryakumar Yadav", role: "Batsman", team: "MI", basePrice: 2.00 },
  { name: "Shubman Gill", role: "Batsman", team: "GT", basePrice: 2.00 },
  { name: "Yashasvi Jaiswal", role: "Batsman", team: "RR", basePrice: 2.00 },
  { name: "Shreyas Iyer", role: "Batsman", team: "PBKS", basePrice: 2.00 },
  { name: "Ruturaj Gaikwad", role: "Batsman", team: "CSK", basePrice: 2.00 },
  { name: "Sanju Samson", role: "Wicketkeeper", team: "RR", basePrice: 2.00 },
  { name: "Rishabh Pant", role: "Wicketkeeper", team: "LSG", basePrice: 2.00 },
  { name: "KL Rahul", role: "Wicketkeeper", team: "DC", basePrice: 2.00 },
  
  { name: "Jasprit Bumrah", role: "Pacer", team: "MI", basePrice: 2.00 },
  { name: "Mohammed Siraj", role: "Pacer", team: "GT", basePrice: 2.00 },
  { name: "Mohammed Shami", role: "Pacer", team: "SRH", basePrice: 2.00 },
  { name: "Trent Boult", role: "Pacer", team: "MI", basePrice: 2.00 },
  { name: "Mitchell Starc", role: "Pacer", team: "DC", basePrice: 2.00 },
  { name: "Pat Cummins", role: "Pacer", team: "SRH", basePrice: 2.00 },
  { name: "Kagiso Rabada", role: "Pacer", team: "GT", basePrice: 2.00 },
  { name: "Jofra Archer", role: "Pacer", team: "RR", basePrice: 2.00 },
  { name: "Arshdeep Singh", role: "Pacer", team: "PBKS", basePrice: 2.00 },
  { name: "Bhuvneshwar Kumar", role: "Pacer", team: "RCB", basePrice: 2.00 },
  { name: "Lockie Ferguson", role: "Pacer", team: "PBKS", basePrice: 2.00 },

  { name: "Rashid Khan", role: "Bowler", team: "GT", basePrice: 2.00 },
  { name: "Yuzvendra Chahal", role: "Bowler", team: "PBKS", basePrice: 2.00 },
  { name: "Kuldeep Yadav", role: "Bowler", team: "DC", basePrice: 2.00 },
  { name: "Sunil Narine", role: "Bowler", team: "KKR", basePrice: 2.00 },
  { name: "Varun Chakravarthy", role: "Bowler", team: "KKR", basePrice: 2.00 },
  
  { name: "MS Dhoni", role: "Wicketkeeper", team: "CSK", basePrice: 2.00 },
  { name: "Heinrich Klaasen", role: "Wicketkeeper", team: "SRH", basePrice: 2.00 },
  { name: "Quinton de Kock", role: "Wicketkeeper", team: "KKR", basePrice: 2.00 },
  { name: "Jos Buttler", role: "Wicketkeeper", team: "GT", basePrice: 2.00 },
  { name: "Nicholas Pooran", role: "Wicketkeeper", team: "LSG", basePrice: 2.00 },
  { name: "Ishan Kishan", role: "Wicketkeeper", team: "SRH", basePrice: 2.00 },

  { name: "Hardik Pandya", role: "All-Rounder", team: "MI", basePrice: 2.00 },
  { name: "Ravindra Jadeja", role: "All-Rounder", team: "CSK", basePrice: 2.00 },
  { name: "Glenn Maxwell", role: "All-Rounder", team: "PBKS", basePrice: 2.00 },
  { name: "Andre Russell", role: "All-Rounder", team: "KKR", basePrice: 2.00 },
  { name: "Marcus Stoinis", role: "All-Rounder", team: "PBKS", basePrice: 2.00 },
  { name: "Sam Curran", role: "All-Rounder", team: "CSK", basePrice: 2.00 },
  { name: "Axar Patel", role: "All-Rounder", team: "DC", basePrice: 2.00 },

  // ==============================
  // 1 CR BRACKET (Mid-Tier & Consistent Performers)
  // ==============================
  { name: "Rajat Patidar", role: "Batsman", team: "RCB", basePrice: 1.00 },
  { name: "Tilak Varma", role: "Batsman", team: "MI", basePrice: 1.00 },
  { name: "Venkatesh Iyer", role: "Batsman", team: "KKR", basePrice: 1.00 },
  { name: "Rahul Tripathi", role: "Batsman", team: "CSK", basePrice: 1.00 },
  { name: "Devdutt Padikkal", role: "Batsman", team: "RCB", basePrice: 1.00 },
  { name: "Rinku Singh", role: "Batsman", team: "KKR", basePrice: 1.00 },
  { name: "Sai Sudharsan", role: "Batsman", team: "GT", basePrice: 1.00 },
  { name: "Tim David", role: "Batsman", team: "RCB", basePrice: 1.00 },
  { name: "Rovman Powell", role: "Batsman", team: "KKR", basePrice: 1.00 },
  { name: "Shimron Hetmyer", role: "Batsman", team: "RR", basePrice: 1.00 },
  { name: "David Miller", role: "Batsman", team: "LSG", basePrice: 1.00 },
  { name: "Aiden Markram", role: "Batsman", team: "LSG", basePrice: 1.00 },
  { name: "Faf du Plessis", role: "Batsman", team: "DC", basePrice: 1.00 },
  { name: "Devon Conway", role: "Batsman", team: "CSK", basePrice: 1.00 },
  { name: "Abhishek Sharma", role: "Batsman", team: "SRH", basePrice: 1.00 },
  { name: "Harry Brook", role: "Batsman", team: "DC", basePrice: 1.00 },
  { name: "Jake Fraser-McGurk", role: "Batsman", team: "DC", basePrice: 1.00 },
  { name: "Tristan Stubbs", role: "Batsman", team: "DC", basePrice: 1.00 },

  { name: "Khaleel Ahmed", role: "Pacer", team: "CSK", basePrice: 1.00 },
  { name: "Harshal Patel", role: "Pacer", team: "PBKS", basePrice: 1.00 },
  { name: "T Natarajan", role: "Pacer", team: "DC", basePrice: 1.00 },
  { name: "Mukesh Kumar", role: "Pacer", team: "DC", basePrice: 1.00 },
  { name: "Avesh Khan", role: "Pacer", team: "LSG", basePrice: 1.00 },
  { name: "Deepak Chahar", role: "Pacer", team: "MI", basePrice: 1.00 },
  { name: "Mohit Sharma", role: "Pacer", team: "DC", basePrice: 1.00 },
  { name: "Josh Hazlewood", role: "Pacer", team: "RCB", basePrice: 1.00 },
  { name: "Anrich Nortje", role: "Pacer", team: "KKR", basePrice: 1.00 },
  { name: "Sandeep Sharma", role: "Pacer", team: "RR", basePrice: 1.00 },
  { name: "Matheesha Pathirana", role: "Pacer", team: "CSK", basePrice: 1.00 },
  { name: "Spencer Johnson", role: "Pacer", team: "KKR", basePrice: 1.00 },

  { name: "Ravi Bishnoi", role: "Bowler", team: "LSG", basePrice: 1.00 },
  { name: "Rahul Chahar", role: "Bowler", team: "SRH", basePrice: 1.00 },
  { name: "Maheesh Theekshana", role: "Bowler", team: "RR", basePrice: 1.00 },
  { name: "Wanindu Hasaranga", role: "Bowler", team: "RR", basePrice: 1.00 },
  { name: "Ravichandran Ashwin", role: "Bowler", team: "CSK", basePrice: 1.00 },
  { name: "Adam Zampa", role: "Bowler", team: "SRH", basePrice: 1.00 },

  { name: "Phil Salt", role: "Wicketkeeper", team: "RCB", basePrice: 1.00 },
  { name: "Rahmanullah Gurbaz", role: "Wicketkeeper", team: "GT", basePrice: 1.00 },
  { name: "Abishek Porel", role: "Wicketkeeper", team: "DC", basePrice: 1.00 },
  { name: "Jitesh Sharma", role: "Wicketkeeper", team: "RCB", basePrice: 1.00 },
  { name: "Josh Inglis", role: "Wicketkeeper", team: "PBKS", basePrice: 1.00 },

  { name: "Washington Sundar", role: "All-Rounder", team: "GT", basePrice: 1.00 },
  { name: "Shivam Dube", role: "All-Rounder", team: "CSK", basePrice: 1.00 },
  { name: "Krunal Pandya", role: "All-Rounder", team: "RCB", basePrice: 1.00 },
  { name: "Marco Jansen", role: "All-Rounder", team: "PBKS", basePrice: 1.00 },
  { name: "Riyan Parag", role: "All-Rounder", team: "RR", basePrice: 1.00 },
  { name: "Rahul Tewatia", role: "All-Rounder", team: "GT", basePrice: 1.00 },
  { name: "Will Jacks", role: "All-Rounder", team: "MI", basePrice: 1.00 },
  { name: "Liam Livingstone", role: "All-Rounder", team: "RCB", basePrice: 1.00 },
  { name: "Rachin Ravindra", role: "All-Rounder", team: "CSK", basePrice: 1.00 },
  { name: "Mitchell Marsh", role: "All-Rounder", team: "LSG", basePrice: 1.00 },
  { name: "Aaron Hardie", role: "All-Rounder", team: "PBKS", basePrice: 1.00 },
  { name: "Azmatullah Omarzai", role: "All-Rounder", team: "PBKS", basePrice: 1.00 },

  // ==============================
  // 20 LAC BRACKET (Uncapped & Domestic Rising Stars)
  // ==============================
  { name: "Shashank Singh", role: "Batsman", team: "PBKS", basePrice: 0.20 },
  { name: "Nehal Wadhera", role: "Batsman", team: "PBKS", basePrice: 0.20 },
  { name: "Ashutosh Sharma", role: "Batsman", team: "MI", basePrice: 0.20 },
  { name: "Sameer Rizvi", role: "Batsman", team: "CSK", basePrice: 0.20 },
  { name: "Naman Dhir", role: "Batsman", team: "MI", basePrice: 0.20 },
  { name: "Ayush Mhatre", role: "Batsman", team: "CSK", basePrice: 0.20 },
  { name: "Vaibhav Suryavanshi", role: "Batsman", team: "RR", basePrice: 0.20 },
  { name: "Angkrish Raghuvanshi", role: "Batsman", team: "KKR", basePrice: 0.20 },
  { name: "Ayush Badoni", role: "Batsman", team: "LSG", basePrice: 0.20 },
  { name: "Abhinav Manohar", role: "Batsman", team: "SRH", basePrice: 0.20 },
  { name: "Shahrukh Khan", role: "Batsman", team: "GT", basePrice: 0.20 },
  { name: "Karun Nair", role: "Batsman", team: "DC", basePrice: 0.20 },
  { name: "Ajinkya Rahane", role: "Batsman", team: "KKR", basePrice: 0.20 },
  { name: "Manish Pandey", role: "Batsman", team: "KKR", basePrice: 0.20 },
  { name: "Shaik Rasheed", role: "Batsman", team: "CSK", basePrice: 0.20 },
  { name: "Matthew Breetzke", role: "Batsman", team: "LSG", basePrice: 0.20 },
  { name: "Mahipal Lomror", role: "Batsman", team: "GT", basePrice: 0.20 },

  { name: "Mayank Yadav", role: "Pacer", team: "LSG", basePrice: 0.20 },
  { name: "Harshit Rana", role: "Pacer", team: "KKR", basePrice: 0.20 },
  { name: "Yash Dayal", role: "Pacer", team: "RCB", basePrice: 0.20 },
  { name: "Akash Deep", role: "Pacer", team: "LSG", basePrice: 0.20 },
  { name: "Akash Madhwal", role: "Pacer", team: "RR", basePrice: 0.20 },
  { name: "Mohsin Khan", role: "Pacer", team: "LSG", basePrice: 0.20 },
  { name: "Mukesh Choudhary", role: "Pacer", team: "CSK", basePrice: 0.20 },
  { name: "Tushar Deshpande", role: "Pacer", team: "RR", basePrice: 0.20 },
  { name: "Rasikh Salam", role: "Pacer", team: "RCB", basePrice: 0.20 },
  { name: "Simarjeet Singh", role: "Pacer", team: "SRH", basePrice: 0.20 },
  { name: "Eathan Bosch", role: "Pacer", team: "SRH", basePrice: 0.20 },
  { name: "Gerald Coetzee", role: "Pacer", team: "GT", basePrice: 0.20 },
  { name: "Fazalhaq Farooqi", role: "Pacer", team: "RR", basePrice: 0.20 },
  { name: "Beuran Hendricks", role: "Pacer", team: "MI", basePrice: 0.20 },
  { name: "Riley Meredith", role: "Pacer", team: "KKR", basePrice: 0.20 },
  { name: "Dushmantha Chameera", role: "Pacer", team: "DC", basePrice: 0.20 },
  { name: "Xavier Bartlett", role: "Pacer", team: "PBKS", basePrice: 0.20 },
  { name: "Vijaykumar Vyshak", role: "Pacer", team: "PBKS", basePrice: 0.20 },
  { name: "Umran Malik", role: "Pacer", team: "KKR", basePrice: 0.20 },
  { name: "Ishant Sharma", role: "Pacer", team: "GT", basePrice: 0.20 },
  { name: "Jaydev Unadkat", role: "Pacer", team: "SRH", basePrice: 0.20 },

  { name: "Suyash Sharma", role: "Bowler", team: "RCB", basePrice: 0.20 },
  { name: "Noor Ahmad", role: "Bowler", team: "CSK", basePrice: 0.20 },
  { name: "R Sai Kishore", role: "Bowler", team: "GT", basePrice: 0.20 },
  { name: "Allah Ghazanfar", role: "Bowler", team: "MI", basePrice: 0.20 },
  { name: "Mayank Markande", role: "Bowler", team: "KKR", basePrice: 0.20 },

  { name: "Prabhsimran Singh", role: "Wicketkeeper", team: "PBKS", basePrice: 0.20 },
  { name: "Dhruv Jurel", role: "Wicketkeeper", team: "RR", basePrice: 0.20 },
  { name: "Robin Minz", role: "Wicketkeeper", team: "MI", basePrice: 0.20 },
  { name: "Kumar Kushagra", role: "Wicketkeeper", team: "RR", basePrice: 0.20 },
  { name: "Ryan Rickelton", role: "Wicketkeeper", team: "MI", basePrice: 0.20 },
  { name: "Harvik Desai", role: "Wicketkeeper", team: "SRH", basePrice: 0.20 },

  { name: "Nitish Kumar Reddy", role: "All-Rounder", team: "SRH", basePrice: 0.20 },
  { name: "Ramandeep Singh", role: "All-Rounder", team: "KKR", basePrice: 0.20 },
  { name: "Deepak Hooda", role: "All-Rounder", team: "CSK", basePrice: 0.20 },
  { name: "Abdul Samad", role: "All-Rounder", team: "LSG", basePrice: 0.20 },
  { name: "Vijay Shankar", role: "All-Rounder", team: "CSK", basePrice: 0.20 },
  { name: "Mitchell Santner", role: "All-Rounder", team: "MI", basePrice: 0.20 },
  { name: "Jacob Bethell", role: "All-Rounder", team: "RCB", basePrice: 0.20 },
  { name: "Romario Shepherd", role: "All-Rounder", team: "RCB", basePrice: 0.20 },
  { name: "Kamindu Mendis", role: "All-Rounder", team: "SRH", basePrice: 0.20 },
  { name: "Jamie Overton", role: "All-Rounder", team: "CSK", basePrice: 0.20 },
  { name: "Sherfane Rutherford", role: "All-Rounder", team: "GT", basePrice: 0.20 },
  { name: "Manoj Bhandage", role: "All-Rounder", team: "RCB", basePrice: 0.20 },
  { name: "Arjun Tendulkar", role: "All-Rounder", team: "MI", basePrice: 0.20 }
];

async function main() {
  console.log("Emptying old player database and squad relationships...");
  await prisma.squad.deleteMany({});
  await prisma.player.deleteMany({});
  
  console.log("Seeding verified 2025/2026 custom IPL dataset...");
  for (const p of players) {
    const apiId = p.name.toLowerCase().replace(/\s+/g, '-');
    await prisma.player.create({
      data: {
        apiId,
        name: p.name,
        role: p.role,
        team: p.team,
        basePrice: p.basePrice
      }
    });
  }
  console.log(`Successfully seeded ${players.length} active players!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
