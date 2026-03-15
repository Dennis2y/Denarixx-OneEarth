import { db } from "@workspace/db";
import {
  sitesTable, energyMetricsTable, protectedPersonsTable,
  safetyIncidentsTable, disasterAlertsTable, riskZonesTable,
  unifiedAlertsTable, usersTable, auditLogTable, simulationHistoryTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

async function clearAll() {
  await db.execute(sql`TRUNCATE TABLE audit_log, simulation_history, unified_alerts, safety_incidents, disaster_alerts, risk_zones, energy_metrics, protected_persons, sites, users RESTART IDENTITY CASCADE`);
  console.log("🧹 Cleared all tables");
}

async function seed() {
  console.log("🌱 Seeding Denarixx OneEarth database...");
  await clearAll();

  const sites = await db.insert(sitesTable).values([
    // Africa
    { name: "Kibera Solar Hub", type: "village", location: "Kibera, Nairobi", country: "Kenya", status: "online", uptime: 98.7, powerAvailability: 94.2, currentRiskLevel: "low", population: 12400, latitude: -1.3133, longitude: 36.7833 },
    { name: "Accra Medical Centre", type: "clinic", location: "Accra Central", country: "Ghana", status: "online", uptime: 99.9, powerAvailability: 99.1, currentRiskLevel: "low", population: 850, latitude: 5.5502, longitude: -0.2174 },
    { name: "Dakar Learning Institute", type: "school", location: "Dakar Plateau", country: "Senegal", status: "warning", uptime: 91.3, powerAvailability: 78.5, currentRiskLevel: "medium", population: 1200, latitude: 14.7167, longitude: -17.4677 },
    { name: "Lagos District Command", type: "district", location: "Lagos Island", country: "Nigeria", status: "online", uptime: 97.2, powerAvailability: 88.0, currentRiskLevel: "medium", population: 45000, latitude: 6.4531, longitude: 3.3958 },
    { name: "Mombasa Coastal Shelter", type: "shelter", location: "Mombasa Old Town", country: "Kenya", status: "critical", uptime: 72.1, powerAvailability: 45.3, currentRiskLevel: "high", population: 320, latitude: -4.0435, longitude: 39.6682 },
    { name: "Kampala Community Grid", type: "village", location: "Kampala North", country: "Uganda", status: "online", uptime: 95.8, powerAvailability: 91.0, currentRiskLevel: "low", population: 8700, latitude: 0.3476, longitude: 32.5825 },
    { name: "Addis Primary School", type: "school", location: "Addis Ababa Bole", country: "Ethiopia", status: "online", uptime: 99.1, powerAvailability: 96.5, currentRiskLevel: "low", population: 980, latitude: 9.0227, longitude: 38.7469 },
    { name: "Kigali Health Post", type: "clinic", location: "Kigali Nyarugenge", country: "Rwanda", status: "warning", uptime: 88.4, powerAvailability: 72.0, currentRiskLevel: "medium", population: 430, latitude: -1.9441, longitude: 30.0619 },
    { name: "Juba District Health Clinic", type: "clinic", location: "Juba Central", country: "South Sudan", status: "warning", uptime: 76.2, powerAvailability: 61.4, currentRiskLevel: "high", population: 680, latitude: 4.8594, longitude: 31.5713 },
    { name: "Nairobi School Safety Node", type: "school", location: "Nairobi Westlands", country: "Kenya", status: "online", uptime: 97.8, powerAvailability: 93.5, currentRiskLevel: "low", population: 2100, latitude: -1.2795, longitude: 36.8099 },
    // Asia-Pacific
    { name: "Jakarta Flood Monitoring Zone", type: "district", location: "North Jakarta", country: "Indonesia", status: "critical", uptime: 68.3, powerAvailability: 52.1, currentRiskLevel: "critical", population: 89000, latitude: -6.1175, longitude: 106.8227 },
    { name: "Dhaka Emergency Shelter", type: "shelter", location: "Dhaka Mirpur", country: "Bangladesh", status: "warning", uptime: 82.5, powerAvailability: 71.3, currentRiskLevel: "high", population: 1850, latitude: 23.8103, longitude: 90.4125 },
    { name: "Manila Community Clinic", type: "clinic", location: "Manila Tondo", country: "Philippines", status: "online", uptime: 94.1, powerAvailability: 87.6, currentRiskLevel: "medium", population: 740, latitude: 14.6042, longitude: 120.9822 },
    { name: "Colombo Village Solar Node", type: "village", location: "Colombo North", country: "Sri Lanka", status: "online", uptime: 98.2, powerAvailability: 95.8, currentRiskLevel: "low", population: 5600, latitude: 6.9271, longitude: 79.8612 },
    // Americas
    { name: "Rio Coastal Storm Watch", type: "district", location: "Rio de Janeiro Norte", country: "Brazil", status: "warning", uptime: 87.9, powerAvailability: 79.2, currentRiskLevel: "high", population: 32000, latitude: -22.9068, longitude: -43.1729 },
    { name: "Port-au-Prince Relief Hub", type: "shelter", location: "Port-au-Prince Centre", country: "Haiti", status: "critical", uptime: 61.4, powerAvailability: 38.7, currentRiskLevel: "critical", population: 2200, latitude: 18.5944, longitude: -72.3074 },
    { name: "Bogotá Mountain School", type: "school", location: "Bogotá Usaquén", country: "Colombia", status: "online", uptime: 96.4, powerAvailability: 92.1, currentRiskLevel: "low", population: 1560, latitude: 4.6097, longitude: -74.0817 },
    // Europe / Central Asia
    { name: "Buchholz Emergency Shelter", type: "shelter", location: "Buchholz, Saxony", country: "Germany", status: "online", uptime: 99.7, powerAvailability: 99.3, currentRiskLevel: "low", population: 890, latitude: 51.3286, longitude: 12.4128 },
    { name: "Kyiv District Command Hub", type: "district", location: "Kyiv Podil", country: "Ukraine", status: "warning", uptime: 84.6, powerAvailability: 73.8, currentRiskLevel: "high", population: 58000, latitude: 50.4501, longitude: 30.5234 },
    { name: "Regional Emergency Coordination Hub", type: "district", location: "Kampala South", country: "Uganda", status: "online", uptime: 99.2, powerAvailability: 97.4, currentRiskLevel: "low", population: 120000, latitude: 0.3214, longitude: 32.5973 },
  ]).returning();

  console.log(`✅ Inserted ${sites.length} sites`);

  // Energy metrics — 48 historical readings per site (last 24h at 30-min intervals)
  const energyRows: Array<{
    siteId: number; solarGeneration: number; batteryLevel: number;
    communityLoad: number; gridStatus: "stable" | "unstable" | "offline"; uptime: number;
    recordedAt: Date;
  }> = [];
  const now = Date.now();
  const baseEnergy = [
    { solar: 87.5, bat: 82.3, load: 61.2, grid: "stable" as const, up: 98.7 },
    { solar: 94.1, bat: 91.0, load: 45.6, grid: "stable" as const, up: 99.9 },
    { solar: 52.3, bat: 34.7, load: 68.9, grid: "unstable" as const, up: 91.3 },
    { solar: 78.6, bat: 71.4, load: 82.3, grid: "stable" as const, up: 97.2 },
    { solar: 18.2, bat: 12.8, load: 38.5, grid: "offline" as const, up: 72.1 },
    { solar: 83.4, bat: 79.2, load: 57.8, grid: "stable" as const, up: 95.8 },
    { solar: 91.7, bat: 88.5, load: 42.3, grid: "stable" as const, up: 99.1 },
    { solar: 61.2, bat: 55.9, load: 73.4, grid: "unstable" as const, up: 88.4 },
    { solar: 38.4, bat: 29.6, load: 55.1, grid: "unstable" as const, up: 76.2 },
    { solar: 89.3, bat: 85.1, load: 48.7, grid: "stable" as const, up: 97.8 },
    { solar: 22.1, bat: 18.4, load: 74.2, grid: "offline" as const, up: 68.3 },
    { solar: 47.8, bat: 41.2, load: 62.8, grid: "unstable" as const, up: 82.5 },
    { solar: 82.6, bat: 77.3, load: 51.4, grid: "stable" as const, up: 94.1 },
    { solar: 93.5, bat: 90.2, load: 39.8, grid: "stable" as const, up: 98.2 },
    { solar: 55.4, bat: 48.9, load: 66.3, grid: "unstable" as const, up: 87.9 },
    { solar: 8.3,  bat: 6.1,  load: 28.4, grid: "offline" as const, up: 61.4 },
    { solar: 88.7, bat: 84.4, load: 46.1, grid: "stable" as const, up: 96.4 },
    { solar: 99.1, bat: 97.8, load: 33.2, grid: "stable" as const, up: 99.7 },
    { solar: 58.3, bat: 51.7, load: 69.5, grid: "unstable" as const, up: 84.6 },
    { solar: 96.8, bat: 94.1, load: 37.6, grid: "stable" as const, up: 99.2 },
  ];

  for (let siteIdx = 0; siteIdx < sites.length; siteIdx++) {
    const base = baseEnergy[siteIdx % baseEnergy.length];
    for (let h = 47; h >= 0; h--) {
      const jitter = (Math.random() - 0.5) * 8;
      const solar = Math.max(0, Math.min(100, base.solar + jitter));
      const bat = Math.max(0, Math.min(100, base.bat + (Math.random() - 0.5) * 6));
      const load = Math.max(10, Math.min(100, base.load + (Math.random() - 0.5) * 10));
      energyRows.push({
        siteId: sites[siteIdx].id,
        solarGeneration: Math.round(solar * 10) / 10,
        batteryLevel: Math.round(bat * 10) / 10,
        communityLoad: Math.round(load * 10) / 10,
        gridStatus: base.grid,
        uptime: base.up,
        recordedAt: new Date(now - h * 30 * 60 * 1000),
      });
    }
  }
  await db.insert(energyMetricsTable).values(energyRows);
  console.log(`✅ Inserted ${energyRows.length} energy readings`);

  await db.insert(protectedPersonsTable).values([
    { name: "Amara Osei", age: 8, category: "child", status: "safe", lastKnownLocation: "Kibera Solar Hub - Block A", contactName: "Kwame Osei", contactPhone: "+254-700-123456", siteId: sites[0].id, notes: "Attends Kibera primary school" },
    { name: "Mama Wanjiku", age: 74, category: "elderly", status: "safe", lastKnownLocation: "Kibera Solar Hub - Block C", contactName: "James Wanjiku", contactPhone: "+254-722-334455", siteId: sites[0].id, notes: "Requires daily medication" },
    { name: "Baby Akinyi", age: 1, category: "child", status: "safe", lastKnownLocation: "Kibera Maternal Clinic", contactName: "Grace Akinyi", contactPhone: "+254-711-667788", siteId: sites[0].id, notes: "Post-natal monitoring" },
    { name: "Peter Kamau", age: 67, category: "elderly", status: "at-risk", lastKnownLocation: "Kibera Solar Hub - Block B", contactName: "Mary Kamau", contactPhone: "+254-700-889900", siteId: sites[0].id, notes: "Heart condition, needs monitoring" },
    { name: "Efua Mensah", age: 6, category: "child", status: "safe", lastKnownLocation: "Accra Medical Centre - Ward 2", contactName: "Kojo Mensah", contactPhone: "+233-24-556677", siteId: sites[1].id, notes: "Recovering from malaria" },
    { name: "Ama Sarpong", age: 82, category: "elderly", status: "safe", lastKnownLocation: "Accra Medical Centre - Geriatric Ward", contactName: "Kwaku Sarpong", contactPhone: "+233-27-889900", siteId: sites[1].id, notes: "Long-term care patient" },
    { name: "Oumar Diallo", age: 82, category: "elderly", status: "at-risk", lastKnownLocation: "Dakar Learning Institute - Rest Room", contactName: "Aminata Diallo", contactPhone: "+221-77-123456", siteId: sites[2].id, notes: "Cardiac medication critically low" },
    { name: "Fatou Ndiaye", age: 9, category: "child", status: "safe", lastKnownLocation: "Dakar Learning Institute - Classroom A", contactName: "Ibrahim Ndiaye", contactPhone: "+221-76-334455", siteId: sites[2].id, notes: "Student" },
    { name: "Seydou Ba", age: 11, category: "child", status: "safe", lastKnownLocation: "Dakar Learning Institute - Classroom B", contactName: "Oumou Ba", contactPhone: "+221-33-556677", siteId: sites[2].id, notes: "Student, vision impairment" },
    { name: "Adaeze Chukwu", age: 5, category: "child", status: "safe", lastKnownLocation: "Lagos District Command - Family Zone", contactName: "Chidi Chukwu", contactPhone: "+234-803-445566", siteId: sites[3].id, notes: "Internally displaced family" },
    { name: "Bola Okafor", age: 78, category: "elderly", status: "safe", lastKnownLocation: "Lagos District Command - Senior Centre", contactName: "Tunde Okafor", contactPhone: "+234-806-778899", siteId: sites[3].id, notes: "Hypertension patient" },
    { name: "Ali Hassan", age: 14, category: "child", status: "emergency", lastKnownLocation: "Mombasa Coastal Shelter - Zone A", contactName: "Omar Hassan", contactPhone: "+254-711-223344", siteId: sites[4].id, notes: "Separated from family during flooding" },
    { name: "Mama Fatuma", age: 88, category: "elderly", status: "emergency", lastKnownLocation: "Mombasa Coastal Shelter - Medical Bay", contactName: "Hassan Fatuma", contactPhone: "+254-722-556677", siteId: sites[4].id, notes: "Diabetic, insulin running low" },
    { name: "Zainab Ali", age: 3, category: "child", status: "at-risk", lastKnownLocation: "Mombasa Coastal Shelter - Zone B", contactName: "Maryam Ali", contactPhone: "+254-700-112233", siteId: sites[4].id, notes: "Malnutrition risk" },
    { name: "Moses Ssekandi", age: 9, category: "child", status: "safe", lastKnownLocation: "Kampala Community Grid - School", contactName: "Sarah Ssekandi", contactPhone: "+256-77-334455", siteId: sites[5].id, notes: "School attendance monitored" },
    { name: "Nakato Nakimuli", age: 71, category: "elderly", status: "safe", lastKnownLocation: "Kampala Community Grid - Elder Centre", contactName: "John Nakimuli", contactPhone: "+256-78-667788", siteId: sites[5].id, notes: "Arthritis, mobile assistance needed" },
    { name: "Tigist Alemu", age: 7, category: "child", status: "safe", lastKnownLocation: "Addis Primary School - Grade 2", contactName: "Dawit Alemu", contactPhone: "+251-91-234567", siteId: sites[6].id, notes: "Student" },
    { name: "Selamawit Tesfaye", age: 79, category: "elderly", status: "safe", lastKnownLocation: "Addis Primary School - Waiting Room", contactName: "Yohannes Tesfaye", contactPhone: "+251-92-345678", siteId: sites[6].id, notes: "Grandmother of student" },
    { name: "Cedric Ineza", age: 12, category: "child", status: "at-risk", lastKnownLocation: "Kigali Health Post - Paediatric Ward", contactName: "Diane Ineza", contactPhone: "+250-78-112233", siteId: sites[7].id, notes: "Malaria complications" },
    { name: "Josephine Mukamana", age: 84, category: "elderly", status: "safe", lastKnownLocation: "Kigali Health Post - Ward C", contactName: "Patrick Mukamana", contactPhone: "+250-72-334455", siteId: sites[7].id, notes: "Post-op recovery" },
    { name: "Dewi Sartika", age: 7, category: "child", status: "emergency", lastKnownLocation: "Jakarta Flood Zone - Temporary Camp", contactName: "Budi Sartika", contactPhone: "+62-812-34567890", siteId: sites[10].id, notes: "Separated after flash flood" },
    { name: "Pak Sutomo", age: 79, category: "elderly", status: "emergency", lastKnownLocation: "Jakarta Flood Zone - Red Cross Tent", contactName: "Ibu Sutomo", contactPhone: "+62-815-44556677", siteId: sites[10].id, notes: "Kidney dialysis required urgently" },
    { name: "Rizki Pratama", age: 12, category: "child", status: "at-risk", lastKnownLocation: "Jakarta Flood Zone - School Shelter", contactName: "Ahmad Pratama", contactPhone: "+62-819-88990011", siteId: sites[10].id, notes: "Asthma, flood water exposure" },
    { name: "Roshni Begum", age: 4, category: "child", status: "at-risk", lastKnownLocation: "Dhaka Emergency Shelter - Family Block", contactName: "Karim Begum", contactPhone: "+880-171-2345678", siteId: sites[11].id, notes: "Respiratory infection" },
    { name: "Fatema Khatun", age: 85, category: "elderly", status: "emergency", lastKnownLocation: "Dhaka Emergency Shelter - Medical Ward", contactName: "Rahim Khatun", contactPhone: "+880-181-5678901", siteId: sites[11].id, notes: "Stroke patient, constant care needed" },
    { name: "Jean-Pierre Duval", age: 10, category: "child", status: "emergency", lastKnownLocation: "Port-au-Prince Relief Hub - Zone C", contactName: "Marie Duval", contactPhone: "+509-3456-7890", siteId: sites[15].id, notes: "Orphaned, trauma support needed" },
    { name: "Grandmère Celestine", age: 91, category: "elderly", status: "emergency", lastKnownLocation: "Port-au-Prince Relief Hub - Medical Bay", contactName: "Pierre Celestine", contactPhone: "+509-2234-5678", siteId: sites[15].id, notes: "Critical — oxygen support required" },
    { name: "Sonya Petrenko", age: 8, category: "child", status: "safe", lastKnownLocation: "Kyiv District Command Hub - Shelter Level 2", contactName: "Olena Petrenko", contactPhone: "+380-44-334-5678", siteId: sites[18].id, notes: "Shelter resident" },
    { name: "Ivan Bondarenko", age: 77, category: "elderly", status: "at-risk", lastKnownLocation: "Kyiv District Command Hub - Medical Point", contactName: "Natalia Bondarenko", contactPhone: "+380-44-556-7890", siteId: sites[18].id, notes: "COPD patient, medication supply limited" },
    { name: "Celine Habimana", age: 5, category: "child", status: "safe", lastKnownLocation: "Regional Hub - Community Zone", contactName: "Felix Habimana", contactPhone: "+256-79-223344", siteId: sites[19].id, notes: "Accompanied by guardian" },
  ]);
  console.log("✅ Inserted protected persons");

  await db.insert(safetyIncidentsTable).values([
    { title: "Flooding — Mass Displacement Event", description: "160+ families displaced from Mombasa coastal area. Shelter at 142% capacity. Emergency resources deployed.", severity: "critical", location: "Mombasa, Kenya", status: "open" },
    { title: "Flash Flood — Jakarta North", description: "3m water level rise in North Jakarta residential blocks. Multiple evacuation routes blocked. 2,800+ persons displaced.", severity: "critical", location: "North Jakarta, Indonesia", status: "in-progress" },
    { title: "Structural Collapse — Port-au-Prince", description: "2 buildings collapsed following tremors. 15 persons trapped. Search and rescue operations active.", severity: "critical", location: "Port-au-Prince, Haiti", status: "in-progress" },
    { title: "SOS Alert — Elderly Medical Emergency", description: "Oumar Diallo (82) — cardiac medication supply critical. Medical transport dispatched from Dakar General Hospital.", severity: "warning", location: "Dakar, Senegal", status: "open" },
    { title: "Cyclone Displacement — Dhaka", description: "Cyclone Amphan aftermath. 420+ families in temporary shelter. Food and water supplies monitored.", severity: "warning", location: "Dhaka, Bangladesh", status: "open" },
    { title: "Grid Surge — Lagos Island", description: "Voltage spike caused temporary outage in sectors 7-9. Emergency switching activated. Resolved within 18 minutes.", severity: "info", location: "Lagos, Nigeria", status: "resolved" },
  ]);
  console.log("✅ Inserted safety incidents");

  await db.insert(disasterAlertsTable).values([
    { type: "flood", title: "Indian Ocean Tropical Storm — Category 3", description: "Severe tropical storm approaching East African coastline. Mombasa and surrounding coastal zones at high risk. Expected landfall in 36 hours.", severity: "critical", region: "East African Coast", country: "Kenya", status: "active", affectedPopulation: 890000 },
    { type: "flood", title: "Niger River Flooding — Extended Inundation", description: "Niger River at 340% normal seasonal flow. Delta region severely flooded. Agricultural infrastructure destroyed across 8 districts.", severity: "critical", region: "Niger Delta", country: "Nigeria", status: "active", affectedPopulation: 2100000 },
    { type: "flood", title: "Jakarta Flash Flood Warning", description: "Monsoon intensification causing rapid water rise in northern Jakarta. 3+ meter surge recorded in Penjaringan district.", severity: "critical", region: "North Jakarta Metro", country: "Indonesia", status: "active", affectedPopulation: 1400000 },
    { type: "storm", title: "Cyclone Idai — Indian Ocean Tracking", description: "Category 4 cyclone tracking toward Mozambique Channel. Madagascar, Mozambique, and Malawi on highest alert.", severity: "critical", region: "Mozambique Channel", country: "Mozambique", status: "active", affectedPopulation: 3200000 },
    { type: "storm", title: "Atlantic Storm System — Caribbean Approach", description: "Tropical storm system intensifying over the Caribbean. Haiti and Dominican Republic at highest risk.", severity: "critical", region: "Caribbean Basin", country: "Haiti", status: "active", affectedPopulation: 5800000 },
    { type: "earthquake", title: "East African Rift Seismic Activity", description: "Series of M4.1-4.8 tremors along the East African Rift Valley. Infrastructure stress monitoring activated at all sites.", severity: "warning", region: "East African Rift Zone", country: "Ethiopia", status: "active", affectedPopulation: 850000 },
    { type: "drought", title: "Sahel Drought — Food Security Crisis", description: "Prolonged drought across Sahel region. Food security index at critical levels. 890,000+ persons at acute food insecurity risk.", severity: "warning", region: "Sahel Belt", country: "Senegal", status: "active", affectedPopulation: 890000 },
    { type: "wildfire", title: "Amazon Fringe Wildfire", description: "Wildfire expanding into populated areas near Manaus. Evacuation corridors established. Air quality hazardous.", severity: "warning", region: "Western Amazon Fringe", country: "Brazil", status: "active", affectedPopulation: 280000 },
    { type: "flood", title: "Mekong River Basin Overflow", description: "Above-normal monsoon season causing Mekong River to overflow in southern regions. Agricultural and village areas affected.", severity: "warning", region: "Mekong Delta Region", country: "Bangladesh", status: "active", affectedPopulation: 4200000 },
    { type: "earthquake", title: "Philippines Luzon Seismic Event", description: "M6.1 earthquake near Manila. Multiple buildings inspected. No major casualties reported, infrastructure assessment ongoing.", severity: "warning", region: "Luzon Island", country: "Philippines", status: "monitoring", affectedPopulation: 920000 },
    { type: "storm", title: "Ukraine Critical Infrastructure — Winter Storm", description: "Severe winter storm impacting Ukraine. Power grid vulnerabilities. Emergency heating and power measures activated.", severity: "warning", region: "Central Ukraine", country: "Ukraine", status: "active", affectedPopulation: 12000000 },
    { type: "drought", title: "Horn of Africa Rainfall Deficit", description: "Fifth consecutive season of below-normal rainfall across Horn of Africa. Pastoralist communities severely impacted.", severity: "info", region: "Horn of Africa", country: "Ethiopia", status: "active", affectedPopulation: 22000000 },
  ]);
  console.log("✅ Inserted disaster alerts");

  await db.insert(riskZonesTable).values([
    { name: "Mombasa Coastal Flood Zone", type: "flood", country: "Kenya", region: "Coast Province", riskLevel: "critical", preparednessScore: 38, latitude: -4.05, longitude: 39.67 },
    { name: "Lagos Niger Delta Flood Risk", type: "flood", country: "Nigeria", region: "Lagos State", riskLevel: "high", preparednessScore: 44, latitude: 6.45, longitude: 3.40 },
    { name: "Jakarta North Coastal Risk", type: "flood", country: "Indonesia", region: "DKI Jakarta", riskLevel: "critical", preparednessScore: 31, latitude: -6.11, longitude: 106.85 },
    { name: "Sahel Desertification Belt", type: "drought", country: "Senegal", region: "Sahel Region", riskLevel: "high", preparednessScore: 47, latitude: 14.72, longitude: -14.45 },
    { name: "East Africa Seismic Corridor", type: "earthquake", country: "Ethiopia", region: "Rift Valley", riskLevel: "medium", preparednessScore: 55, latitude: 8.49, longitude: 38.77 },
    { name: "Caribbean Storm Belt", type: "storm", country: "Haiti", region: "Western Caribbean", riskLevel: "critical", preparednessScore: 27, latitude: 18.97, longitude: -72.34 },
    { name: "Bangladesh Cyclone Coastal Zone", type: "storm", country: "Bangladesh", region: "Bay of Bengal Coast", riskLevel: "high", preparednessScore: 52, latitude: 21.45, longitude: 90.38 },
    { name: "Ukraine Power Grid Vulnerability Zone", type: "storm", country: "Ukraine", region: "Central Ukraine", riskLevel: "high", preparednessScore: 58, latitude: 49.00, longitude: 31.38 },
  ]);
  console.log("✅ Inserted risk zones");

  await db.insert(unifiedAlertsTable).values([
    { title: "Flash Flood — Mombasa Coastal Shelter", module: "earthshield", severity: "critical", location: "Mombasa, Kenya", status: "active", description: "Rapid 2m water rise threatening shelter integrity. Evacuation of 320 persons initiated. Emergency transport requested." },
    { title: "Power Failure — Port-au-Prince Relief Hub", module: "energy", severity: "critical", location: "Port-au-Prince, Haiti", status: "active", description: "Total grid failure at main relief hub. Backup generator fuel estimated at 4 hours. Medical equipment at risk." },
    { title: "Jakarta Flood — Mass Displacement", module: "earthshield", severity: "critical", location: "North Jakarta, Indonesia", status: "active", description: "89,000 persons at immediate risk. Evacuation routes Jl. Pluit and Jl. Kapuk blocked. Emergency water barrier deployment urgent." },
    { title: "SOS — Medical Emergency Dakar", module: "lifemesh", severity: "critical", location: "Dakar, Senegal", status: "active", description: "Oumar Diallo (82) cardiac episode reported. No medication available on site. Medical evacuation in progress." },
    { title: "Cyclone Approach — Category 4", module: "earthshield", severity: "critical", location: "Mozambique Channel", status: "active", description: "Category 4 cyclone Idai tracking toward coast. Expected landfall in 18 hours. 3.2M persons in affected zone." },
    { title: "Grid Fluctuation — Lagos District", module: "energy", severity: "warning", location: "Lagos, Nigeria", status: "active", description: "Voltage drop 23% in Sector 4. Secondary lines experiencing instability. Load redistribution in progress." },
    { title: "Overcapacity — Mombasa Shelter", module: "lifemesh", severity: "warning", location: "Mombasa, Kenya", status: "active", description: "Shelter at 142% capacity. Food and water supplies critically low. Additional facilities urgently required." },
    { title: "Drought Alert — Sahel Region", module: "earthshield", severity: "warning", location: "Sahel Belt, Senegal", status: "active", description: "Food security index at critical levels. 890,000 persons at risk of acute food insecurity. NGO coordination activated." },
    { title: "Seismic Activity — East African Rift", module: "earthshield", severity: "warning", location: "Ethiopia, Rift Valley", status: "acknowledged", description: "Repeated M4.1-4.8 tremors detected. Infrastructure stress monitoring activated at all Rift zone sites." },
    { title: "Solar Inverter Fault — Dakar School", module: "energy", severity: "warning", location: "Dakar, Senegal", status: "acknowledged", description: "Inverter Unit 2 reporting fault code E-047. Solar generation reduced 40%. Maintenance team dispatched." },
    { title: "Dhaka Shelter — Water Supply Critical", module: "energy", severity: "warning", location: "Dhaka, Bangladesh", status: "active", description: "Potable water reserves at 12% capacity. Emergency resupply convoy delayed by flood damage on access road." },
    { title: "Kyiv Grid Instability — Winter Storm", module: "energy", severity: "warning", location: "Kyiv, Ukraine", status: "active", description: "Severe winter storm causing grid voltage spikes. Protective relays triggered in 3 substations." },
    { title: "Bogotá Mountain Road — Landslide Risk", module: "earthshield", severity: "warning", location: "Bogotá, Colombia", status: "acknowledged", description: "Heavy rainfall creating landslide risk on access route to Bogotá Mountain School. Route assessment in progress." },
    { title: "Wildfire Monitor — Amazon Fringe", module: "earthshield", severity: "info", location: "Western Amazon, Brazil", status: "active", description: "Air quality index AQI 187 (Very Unhealthy) at Rio Coastal monitoring stations. Protective measures advised." },
    { title: "Lake Victoria — Above Seasonal Level", module: "earthshield", severity: "info", location: "Lake Victoria Basin, Uganda", status: "acknowledged", description: "Lake Victoria 0.8m above seasonal average. Routine monitoring in progress. No immediate risk to infrastructure." },
    { title: "Emergency Drill Completed — Nairobi", module: "lifemesh", severity: "info", location: "Nairobi, Kenya", status: "resolved", description: "Scheduled evacuation drill at Nairobi School Safety Node completed. 2,100 persons accounted for in 8 minutes 42 seconds." },
    { title: "Security Incident Resolved — Lagos", module: "lifemesh", severity: "info", location: "Lagos, Nigeria", status: "resolved", description: "Security perimeter incident at Lagos District Command fully resolved. All access controls restored." },
    { title: "Backup Solar Restored — Kigali", module: "energy", severity: "info", location: "Kigali, Rwanda", status: "resolved", description: "Secondary solar array brought online at Kigali Health Post following maintenance. Power availability restored to 91%." },
    { title: "Manila Clinic — Routine Inspection Passed", module: "energy", severity: "info", location: "Manila, Philippines", status: "resolved", description: "All systems at Manila Community Clinic passed quarterly safety and power inspection. No deficiencies noted." },
  ]);
  console.log("✅ Inserted unified alerts");

  await db.insert(usersTable).values([
    { name: "Dr. Amara Diallo", email: "a.diallo@denarixx.org", role: "admin", organization: "Denarixx OneEarth Global", status: "active", lastLogin: new Date(now - 2 * 60 * 60 * 1000) },
    { name: "Kwame Asante-Mensah", email: "k.asante@denarixx.org", role: "admin", organization: "Denarixx OneEarth Global Operations", status: "active", lastLogin: new Date(now - 30 * 60 * 1000) },
    { name: "Fatima Al-Rashid", email: "f.rashid@denarixx.org", role: "operator", organization: "Denarixx Energy - East Africa Hub", status: "active", lastLogin: new Date(now - 4 * 60 * 60 * 1000) },
    { name: "Emmanuel Okonkwo", email: "e.okonkwo@denarixx.org", role: "operator", organization: "Denarixx LifeMesh - Nigeria", status: "active", lastLogin: new Date(now - 1 * 60 * 60 * 1000) },
    { name: "Aissatou Balde", email: "a.balde@denarixx.org", role: "operator", organization: "Denarixx EarthShield - West Africa Hub", status: "active", lastLogin: new Date(now - 6 * 60 * 60 * 1000) },
    { name: "Grace Nakato-Ssemanda", email: "g.nakato@family.ug", role: "family", organization: "Private - Kampala", status: "active", lastLogin: new Date(now - 12 * 60 * 60 * 1000) },
    { name: "Kofi Boateng", email: "k.boateng@family.gh", role: "family", organization: "Private - Accra", status: "active", lastLogin: new Date(now - 2 * 24 * 60 * 60 * 1000) },
    { name: "Commissioner James Otieno", email: "j.otieno@gov.ke", role: "government", organization: "Kenya National Emergency Management", status: "active", lastLogin: new Date(now - 3 * 60 * 60 * 1000) },
    { name: "Minister Adwoa Sarpong", email: "a.sarpong@gov.gh", role: "government", organization: "Ghana Disaster Management Authority", status: "active", lastLogin: new Date(now - 1 * 24 * 60 * 60 * 1000) },
    { name: "Director Thierno Bah", email: "t.bah@gov.sn", role: "government", organization: "Senegal Civil Protection", status: "inactive", lastLogin: new Date(now - 7 * 24 * 60 * 60 * 1000) },
    { name: "Leilani Nakamura", email: "l.nakamura@denarixx.org", role: "operator", organization: "Denarixx Asia-Pacific Hub", status: "active", lastLogin: new Date(now - 45 * 60 * 1000) },
    { name: "Carlos Mendoza", email: "c.mendoza@denarixx.org", role: "operator", organization: "Denarixx Latin America", status: "active", lastLogin: new Date(now - 2 * 60 * 60 * 1000) },
    { name: "Sofia Vasylenko", email: "s.vasylenko@gov.ua", role: "government", organization: "Ukraine Emergency Management", status: "active", lastLogin: new Date(now - 5 * 60 * 60 * 1000) },
    { name: "Dr. Priya Anand", email: "p.anand@denarixx.org", role: "admin", organization: "Denarixx South Asia Operations", status: "active", lastLogin: new Date(now - 3 * 60 * 60 * 1000) },
  ]);
  console.log("✅ Inserted users");

  await db.insert(simulationHistoryTable).values([
    {
      scenarioId: `SIM-flood_event-${now - 7 * 24 * 3600_000}`,
      scenarioType: "flood_event", scenarioLabel: "Flood Event",
      operatorEmail: "commander@denarixx.io", operatorName: "Cmdr. Prime", operatorRole: "admin",
      readinessScore: 54, riskSeverity: "critical",
      affectedSitesCount: 4, affectedPersonsCount: 12, estimatedPopulationAtRisk: 13890,
      resultJson: JSON.stringify({ actions: ["Activate emergency water barriers", "Evacuate protected persons"], status: "completed" }),
      simulatedAt: new Date(now - 7 * 24 * 3600_000),
    },
    {
      scenarioId: `SIM-severe_storm-${now - 3 * 24 * 3600_000}`,
      scenarioType: "severe_storm", scenarioLabel: "Severe Storm",
      operatorEmail: "adaeze@denarixx.io", operatorName: "Adaeze Okonkwo", operatorRole: "operator",
      readinessScore: 68, riskSeverity: "critical",
      affectedSitesCount: 3, affectedPersonsCount: 8, estimatedPopulationAtRisk: 8900,
      resultJson: JSON.stringify({ actions: ["Lock down school and clinic sites", "Activate backup reserves"], status: "completed" }),
      simulatedAt: new Date(now - 3 * 24 * 3600_000),
    },
    {
      scenarioId: `SIM-multi_site_outage-${now - 1 * 24 * 3600_000}`,
      scenarioType: "multi_site_outage", scenarioLabel: "Multi-Site Power Outage",
      operatorEmail: "commander@denarixx.io", operatorName: "Cmdr. Prime", operatorRole: "admin",
      readinessScore: 71, riskSeverity: "warning",
      affectedSitesCount: 5, affectedPersonsCount: 15, estimatedPopulationAtRisk: 25000,
      resultJson: JSON.stringify({ actions: ["Activate backup generators", "Redistribute load"], status: "completed" }),
      simulatedAt: new Date(now - 1 * 24 * 3600_000),
    },
    {
      scenarioId: `SIM-child_emergency_sos-${now - 6 * 3600_000}`,
      scenarioType: "child_emergency_sos", scenarioLabel: "Child Emergency SOS",
      operatorEmail: "adaeze@denarixx.io", operatorName: "Adaeze Okonkwo", operatorRole: "operator",
      readinessScore: 82, riskSeverity: "critical",
      affectedSitesCount: 1, affectedPersonsCount: 3, estimatedPopulationAtRisk: 320,
      resultJson: JSON.stringify({ actions: ["Dispatch emergency response team", "Contact family"], status: "completed" }),
      simulatedAt: new Date(now - 6 * 3600_000),
    },
    {
      scenarioId: `SIM-wildfire_risk-${now - 2 * 24 * 3600_000}`,
      scenarioType: "wildfire_risk", scenarioLabel: "Wildfire Risk",
      operatorEmail: "commander@denarixx.io", operatorName: "Cmdr. Prime", operatorRole: "admin",
      readinessScore: 76, riskSeverity: "warning",
      affectedSitesCount: 2, affectedPersonsCount: 6, estimatedPopulationAtRisk: 40000,
      resultJson: JSON.stringify({ actions: ["Establish exclusion perimeter", "Pre-position water tankers"], status: "completed" }),
      simulatedAt: new Date(now - 2 * 24 * 3600_000),
    },
  ]);
  console.log("✅ Inserted simulation history");

  const auditEntries = [
    { actor: "commander@denarixx.io", actorRole: "admin", action: "auth.login", target: "user:1", details: JSON.stringify({ name: "Cmdr. Prime" }), createdAt: new Date(now - 2 * 60 * 60 * 1000) },
    { actor: "adaeze@denarixx.io", actorRole: "operator", action: "auth.login", target: "user:2", details: JSON.stringify({ name: "Adaeze Okonkwo" }), createdAt: new Date(now - 1.5 * 60 * 60 * 1000) },
    { actor: "kofi@gov.gh", actorRole: "government", action: "auth.login", target: "user:3", details: JSON.stringify({ name: "Dr. Kofi Mensah" }), createdAt: new Date(now - 3 * 60 * 60 * 1000) },
    { actor: "commander@denarixx.io", actorRole: "admin", action: "scenario.run", target: "scenario:flood_event", details: JSON.stringify({ label: "Flood Event", readinessScore: 54 }), createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000) },
    { actor: "adaeze@denarixx.io", actorRole: "operator", action: "alert.acknowledged", target: "alert:9", details: JSON.stringify({ title: "Seismic Activity — East African Rift" }), createdAt: new Date(now - 5 * 60 * 60 * 1000) },
    { actor: "adaeze@denarixx.io", actorRole: "operator", action: "alert.acknowledged", target: "alert:10", details: JSON.stringify({ title: "Solar Inverter Fault — Dakar School" }), createdAt: new Date(now - 4 * 60 * 60 * 1000) },
    { actor: "commander@denarixx.io", actorRole: "admin", action: "alert.broadcast", target: "broadcast", details: JSON.stringify({ title: "Emergency Drill — Nairobi Evacuation" }), createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000) },
    { actor: "commander@denarixx.io", actorRole: "admin", action: "report.generate", target: "site:1", details: JSON.stringify({ reportType: "site_resilience", reportId: "RPT-SITE-1-seed" }), createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000) },
    { actor: "adaeze@denarixx.io", actorRole: "operator", action: "scenario.run", target: "scenario:severe_storm", details: JSON.stringify({ label: "Severe Storm", readinessScore: 68 }), createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000) },
    { actor: "kofi@gov.gh", actorRole: "government", action: "report.generate", target: "alerts", details: JSON.stringify({ reportType: "alerts_summary" }), createdAt: new Date(now - 2.5 * 60 * 60 * 1000) },
    { actor: "commander@denarixx.io", actorRole: "admin", action: "site.update", target: "site:5", details: JSON.stringify({ status: "critical", currentRiskLevel: "high" }), createdAt: new Date(now - 4.5 * 60 * 60 * 1000) },
    { actor: "commander@denarixx.io", actorRole: "admin", action: "drill.run", target: "drill:evacuation", details: JSON.stringify({ drillType: "evacuation" }), createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000) },
    { actor: "adaeze@denarixx.io", actorRole: "operator", action: "scenario.run", target: "scenario:multi_site_outage", details: JSON.stringify({ label: "Multi-Site Power Outage", readinessScore: 71 }), createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000) },
    { actor: "fatuma@community.ke", actorRole: "community", action: "auth.login", target: "user:4", details: JSON.stringify({ name: "Fatuma Wanjiru" }), createdAt: new Date(now - 8 * 60 * 60 * 1000) },
    { actor: "adaeze@denarixx.io", actorRole: "operator", action: "alert.broadcast", target: "broadcast", details: JSON.stringify({ title: "Grid Maintenance Window", severity: "info" }), createdAt: new Date(now - 6 * 60 * 60 * 1000) },
    { actor: "commander@denarixx.io", actorRole: "admin", action: "scenario.run", target: "scenario:child_emergency_sos", details: JSON.stringify({ label: "Child Emergency SOS", readinessScore: 82 }), createdAt: new Date(now - 6 * 60 * 60 * 1000) },
    { actor: "commander@denarixx.io", actorRole: "admin", action: "report.generate", target: "daily", details: JSON.stringify({ reportType: "daily_operational" }), createdAt: new Date(now - 1 * 60 * 60 * 1000) },
    { actor: "adaeze@denarixx.io", actorRole: "operator", action: "alert.resolved", target: "alert:18", details: JSON.stringify({ title: "Backup Solar Restored — Kigali" }), createdAt: new Date(now - 30 * 60 * 1000) },
    { actor: "adaeze@denarixx.io", actorRole: "operator", action: "node.deploy", target: "site:20", details: JSON.stringify({ siteName: "Regional Emergency Coordination Hub" }), createdAt: new Date(now - 20 * 60 * 1000) },
    { actor: "commander@denarixx.io", actorRole: "admin", action: "auth.logout", target: "user:1", details: null, createdAt: new Date(now - 10 * 60 * 1000) },
    { actor: "commander@denarixx.io", actorRole: "admin", action: "auth.login", target: "user:1", details: JSON.stringify({ name: "Cmdr. Prime" }), createdAt: new Date(now - 8 * 60 * 1000) },
    { actor: "adaeze@denarixx.io", actorRole: "operator", action: "alert.acknowledged", target: "alert:13", details: JSON.stringify({ title: "Bogotá Mountain Road — Landslide Risk" }), createdAt: new Date(now - 3 * 60 * 1000) },
    { actor: "commander@denarixx.io", actorRole: "admin", action: "scenario.run", target: "scenario:wildfire_risk", details: JSON.stringify({ label: "Wildfire Risk", readinessScore: 76 }), createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000) },
    { actor: "commander@denarixx.io", actorRole: "admin", action: "drill.run", target: "drill:medical", details: JSON.stringify({ drillType: "medical" }), createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000) },
    { actor: "adaeze@denarixx.io", actorRole: "operator", action: "site.update", target: "site:3", details: JSON.stringify({ status: "warning", powerAvailability: 78.5 }), createdAt: new Date(now - 12 * 60 * 60 * 1000) },
    { actor: "commander@denarixx.io", actorRole: "admin", action: "node.deploy", target: "site:11", details: JSON.stringify({ siteName: "Jakarta Flood Monitoring Zone" }), createdAt: new Date(now - 6 * 24 * 60 * 60 * 1000) },
    { actor: "kofi@gov.gh", actorRole: "government", action: "auth.logout", target: "user:3", details: null, createdAt: new Date(now - 25 * 60 * 1000) },
    { actor: "adaeze@denarixx.io", actorRole: "operator", action: "report.generate", target: "site:5", details: JSON.stringify({ reportType: "site_resilience", reportId: "RPT-SITE-5-seed" }), createdAt: new Date(now - 45 * 60 * 1000) },
    { actor: "commander@denarixx.io", actorRole: "admin", action: "alert.broadcast", target: "broadcast", details: JSON.stringify({ title: "System-Wide Status Check — All Zones", severity: "info" }), createdAt: new Date(now - 90 * 60 * 1000) },
    { actor: "fatuma@community.ke", actorRole: "community", action: "auth.logout", target: "user:4", details: null, createdAt: new Date(now - 4 * 60 * 60 * 1000) },
  ];
  await db.insert(auditLogTable).values(auditEntries);
  console.log(`✅ Inserted ${auditEntries.length} audit log entries`);

  console.log(`\n🎉 Seeding complete!`);
  console.log(`   📍 ${sites.length} global sites`);
  console.log(`   ⚡ ${energyRows.length} energy readings`);
  console.log(`   👥 30 protected persons`);
  console.log(`   🚨 19 unified alerts`);
  console.log(`   🌍 12 disaster alerts + 8 risk zones`);
  console.log(`   📋 ${auditEntries.length} audit log entries`);
  console.log(`   🎭 5 simulation runs`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
