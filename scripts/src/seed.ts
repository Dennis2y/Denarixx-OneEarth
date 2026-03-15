import { db } from "@workspace/db";
import {
  sitesTable,
  energyMetricsTable,
  protectedPersonsTable,
  safetyIncidentsTable,
  disasterAlertsTable,
  riskZonesTable,
  unifiedAlertsTable,
  usersTable,
} from "@workspace/db";

async function seed() {
  console.log("🌱 Seeding Denarixx OneEarth database...");

  const sites = await db.insert(sitesTable).values([
    { name: "Kibera Solar Hub", type: "village", location: "Kibera, Nairobi", country: "Kenya", status: "online", uptime: 98.7, powerAvailability: 94.2, currentRiskLevel: "low", population: 12400, latitude: -1.3133, longitude: 36.7833 },
    { name: "Accra Medical Centre", type: "clinic", location: "Accra Central", country: "Ghana", status: "online", uptime: 99.9, powerAvailability: 99.1, currentRiskLevel: "low", population: 850, latitude: 5.5502, longitude: -0.2174 },
    { name: "Dakar Learning Institute", type: "school", location: "Dakar Plateau", country: "Senegal", status: "warning", uptime: 91.3, powerAvailability: 78.5, currentRiskLevel: "medium", population: 1200, latitude: 14.7167, longitude: -17.4677 },
    { name: "Lagos District Command", type: "district", location: "Lagos Island", country: "Nigeria", status: "online", uptime: 97.2, powerAvailability: 88.0, currentRiskLevel: "medium", population: 45000, latitude: 6.4531, longitude: 3.3958 },
    { name: "Mombasa Coastal Shelter", type: "shelter", location: "Mombasa Old Town", country: "Kenya", status: "critical", uptime: 72.1, powerAvailability: 45.3, currentRiskLevel: "high", population: 320, latitude: -4.0435, longitude: 39.6682 },
    { name: "Kampala Community Grid", type: "village", location: "Kampala North", country: "Uganda", status: "online", uptime: 95.8, powerAvailability: 91.0, currentRiskLevel: "low", population: 8700, latitude: 0.3476, longitude: 32.5825 },
    { name: "Addis Primary School", type: "school", location: "Addis Ababa Bole", country: "Ethiopia", status: "online", uptime: 99.1, powerAvailability: 96.5, currentRiskLevel: "low", population: 980, latitude: 9.0227, longitude: 38.7469 },
    { name: "Kigali Health Post", type: "clinic", location: "Kigali Nyarugenge", country: "Rwanda", status: "warning", uptime: 88.4, powerAvailability: 72.0, currentRiskLevel: "medium", population: 430, latitude: -1.9441, longitude: 30.0619 },
  ]).returning();

  console.log(`✅ Inserted ${sites.length} sites`);

  await db.insert(energyMetricsTable).values([
    { siteId: sites[0].id, solarGeneration: 87.5, batteryLevel: 82.3, communityLoad: 61.2, gridStatus: "stable", uptime: 98.7 },
    { siteId: sites[1].id, solarGeneration: 94.1, batteryLevel: 91.0, communityLoad: 45.6, gridStatus: "stable", uptime: 99.9 },
    { siteId: sites[2].id, solarGeneration: 52.3, batteryLevel: 34.7, communityLoad: 68.9, gridStatus: "unstable", uptime: 91.3 },
    { siteId: sites[3].id, solarGeneration: 78.6, batteryLevel: 71.4, communityLoad: 82.3, gridStatus: "stable", uptime: 97.2 },
    { siteId: sites[4].id, solarGeneration: 18.2, batteryLevel: 12.8, communityLoad: 38.5, gridStatus: "offline", uptime: 72.1 },
    { siteId: sites[5].id, solarGeneration: 83.4, batteryLevel: 79.2, communityLoad: 57.8, gridStatus: "stable", uptime: 95.8 },
    { siteId: sites[6].id, solarGeneration: 91.7, batteryLevel: 88.5, communityLoad: 42.3, gridStatus: "stable", uptime: 99.1 },
    { siteId: sites[7].id, solarGeneration: 61.2, batteryLevel: 55.9, communityLoad: 73.4, gridStatus: "unstable", uptime: 88.4 },
  ]);

  console.log("✅ Inserted energy metrics");

  await db.insert(protectedPersonsTable).values([
    { name: "Amara Osei", age: 8, category: "child", status: "safe", lastKnownLocation: "Kibera Solar Hub - Block A", contactName: "Kwame Osei", contactPhone: "+254-700-123456", siteId: sites[0].id, notes: "Attends local primary school" },
    { name: "Fatima Al-Hassan", age: 7, category: "child", status: "safe", lastKnownLocation: "Accra Medical Centre - Ward 2", contactName: "Mohammed Al-Hassan", contactPhone: "+233-244-789012", siteId: sites[1].id },
    { name: "Oumar Diallo", age: 82, category: "elderly", status: "at-risk", lastKnownLocation: "Dakar Learning Institute - Residence", contactName: "Aissatou Diallo", contactPhone: "+221-77-345678", siteId: sites[2].id, notes: "Requires daily medication - cardiac condition" },
    { name: "Chidinma Eze", age: 78, category: "elderly", status: "safe", lastKnownLocation: "Lagos District Command - East Wing", contactName: "Emmanuel Eze", contactPhone: "+234-803-901234", siteId: sites[3].id },
    { name: "Zawadi Muthoni", age: 34, category: "family", status: "emergency", lastKnownLocation: "Mombasa Coastal Shelter - Zone C", contactName: "David Muthoni", contactPhone: "+254-722-567890", siteId: sites[4].id, notes: "Pregnant - 8 months - requires evacuation" },
    { name: "Blessing Nakato", age: 12, category: "child", status: "safe", lastKnownLocation: "Kampala Community Grid - School", contactName: "Grace Nakato", contactPhone: "+256-700-234567", siteId: sites[5].id },
    { name: "Tigist Bekele", age: 71, category: "elderly", status: "safe", lastKnownLocation: "Addis Primary School - Community Hall", contactName: "Dereje Bekele", contactPhone: "+251-911-678901", siteId: sites[6].id },
    { name: "Jean-Pierre Habimana", age: 45, category: "vulnerable", status: "at-risk", lastKnownLocation: "Kigali Health Post - Ward 1", contactName: "Marie Habimana", contactPhone: "+250-788-456789", siteId: sites[7].id, notes: "Diabetes - insulin dependent" },
    { name: "Kofi Asante", age: 10, category: "child", status: "safe", lastKnownLocation: "Accra Medical Centre - Children's Ward", contactName: "Akua Asante", contactPhone: "+233-244-111222", siteId: sites[1].id },
    { name: "Amina Yusuf", age: 67, category: "elderly", status: "safe", lastKnownLocation: "Kibera Solar Hub - Elder Care Unit", contactName: "Omar Yusuf", contactPhone: "+254-700-333444", siteId: sites[0].id },
  ]);

  console.log("✅ Inserted protected persons");

  await db.insert(safetyIncidentsTable).values([
    { title: "Flood Evacuation - Mombasa Coastal", description: "Rising water levels along the coastline require immediate evacuation of Shelter Zone C. Multiple families at risk.", severity: "critical", location: "Mombasa Coastal Shelter", status: "in-progress", occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { title: "Missing Child Report - Kibera", description: "8-year-old child (Amara Osei) reported missing from Block A. Last seen at 14:30 local time. Search teams deployed.", severity: "critical", location: "Kibera Solar Hub", status: "open", occurredAt: new Date(Date.now() - 45 * 60 * 1000) },
    { title: "Medical Emergency - Dakar", description: "Elderly resident Oumar Diallo requires urgent medical transport. Cardiac medication supply critically low.", severity: "warning", location: "Dakar Learning Institute", status: "in-progress", occurredAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    { title: "Power Outage Impact - Kigali", description: "Extended power outage affecting medical equipment at health post. Generator fuel reserves at 15%.", severity: "warning", location: "Kigali Health Post", status: "open", occurredAt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
    { title: "Community Shelter Overcapacity", description: "Mombasa shelter operating at 142% capacity due to incoming displaced families from coastal flooding.", severity: "warning", location: "Mombasa Coastal Shelter", status: "open", occurredAt: new Date(Date.now() - 12 * 60 * 60 * 1000) },
    { title: "Security Alert - Lagos District", description: "Perimeter security breach detected at Lagos District Command. Security protocol Alpha activated.", severity: "info", location: "Lagos District Command", status: "resolved", occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  ]);

  console.log("✅ Inserted safety incidents");

  await db.insert(disasterAlertsTable).values([
    { title: "Indian Ocean Tropical Storm - Coastal East Africa", type: "storm", severity: "critical", region: "East African Coast", country: "Kenya", description: "Category 3 tropical storm approaching the Kenyan coastline. Expected landfall within 48 hours. Evacuation orders issued for coastal communities.", affectedPopulation: 125000, status: "active" },
    { title: "Niger River Flooding - West Africa", type: "flood", severity: "critical", region: "Niger River Basin", country: "Nigeria", description: "Unprecedented flooding along the Niger River. Water levels 4.2m above flood threshold. 87 communities at risk.", affectedPopulation: 340000, status: "active" },
    { title: "Sahel Drought Escalation", type: "drought", severity: "warning", region: "Sahel Region", country: "Senegal", description: "Prolonged drought conditions threatening crop yields and water security across the Sahel. Food security index at critical levels.", affectedPopulation: 890000, status: "monitoring" },
    { title: "Rift Valley Seismic Activity", type: "earthquake", severity: "warning", region: "East African Rift", country: "Ethiopia", description: "Increased seismic activity detected along the East African Rift Valley. Magnitude 4.1-4.8 tremors recorded over 72 hours.", affectedPopulation: 45000, status: "monitoring" },
    { title: "Kilimanjaro Glacial Melt Risk", type: "flood", severity: "warning", region: "Kilimanjaro Region", country: "Tanzania", description: "Accelerated glacial melt on Mount Kilimanjaro creating flash flood risk in downstream communities.", affectedPopulation: 28000, status: "monitoring" },
    { title: "Power Grid Failure - Lagos", type: "infrastructure", severity: "critical", region: "Lagos Metropolitan", country: "Nigeria", description: "Major power transmission failure affecting 3 substations. 40% of the metropolitan area without power. Emergency generators activated.", affectedPopulation: 2100000, status: "active" },
    { title: "Acacia Forest Fire - Rwanda", type: "wildfire", severity: "warning", region: "Nyungwe Forest", country: "Rwanda", description: "Forest fire detected in Nyungwe National Park buffer zone. Wind direction shifting toward residential areas.", affectedPopulation: 12000, status: "monitoring" },
    { title: "Lake Victoria Water Surge", type: "flood", severity: "info", region: "Lake Victoria Basin", country: "Uganda", description: "Lake Victoria water levels 0.8m above seasonal average. Monitoring underway for potential shoreline flooding.", affectedPopulation: 67000, status: "monitoring" },
  ]);

  console.log("✅ Inserted disaster alerts");

  await db.insert(riskZonesTable).values([
    { name: "Mombasa Coastal Zone", type: "flood", riskLevel: "critical", region: "Mombasa County", country: "Kenya", preparednessScore: 42, latitude: -4.0435, longitude: 39.6682 },
    { name: "Lagos Niger Delta", type: "flood", riskLevel: "critical", region: "Niger Delta", country: "Nigeria", preparednessScore: 38, latitude: 4.8000, longitude: 7.0000 },
    { name: "Dakar Sahel Fringe", type: "drought", riskLevel: "high", region: "Thiès Region", country: "Senegal", preparednessScore: 55, latitude: 14.8000, longitude: -16.5000 },
    { name: "Rift Valley Seismic Belt", type: "earthquake", riskLevel: "high", region: "Awash Valley", country: "Ethiopia", preparednessScore: 61, latitude: 8.9806, longitude: 40.0168 },
    { name: "Nyungwe Forest Buffer", type: "wildfire", riskLevel: "medium", region: "Southern Province", country: "Rwanda", preparednessScore: 74, latitude: -2.4833, longitude: 29.3167 },
    { name: "Nairobi Slum Settlement", type: "infrastructure", riskLevel: "high", region: "Nairobi County", country: "Kenya", preparednessScore: 48, latitude: -1.2921, longitude: 36.8219 },
    { name: "Lake Victoria Shoreline", type: "flood", riskLevel: "medium", region: "Central Region", country: "Uganda", preparednessScore: 67, latitude: -0.2553, longitude: 31.8083 },
    { name: "Accra Coastal Erosion Zone", type: "flood", riskLevel: "medium", region: "Greater Accra", country: "Ghana", preparednessScore: 71, latitude: 5.5502, longitude: -0.2174 },
  ]);

  console.log("✅ Inserted risk zones");

  await db.insert(unifiedAlertsTable).values([
    { title: "Critical Battery Level - Mombasa Shelter", module: "energy", severity: "critical", location: "Mombasa Coastal Shelter", status: "active", description: "Battery storage at 12.8% - estimated 3 hours of power remaining. Emergency generator required immediately." },
    { title: "Grid Offline - Mombasa Shelter", module: "energy", severity: "critical", location: "Mombasa Coastal Shelter", status: "active", description: "Main power grid connection offline. Site operating on solar + battery backup only." },
    { title: "SOS Alert - Zawadi Muthoni", module: "lifemesh", severity: "critical", location: "Mombasa Coastal Shelter - Zone C", status: "active", description: "Emergency SOS triggered. Pregnant individual requires immediate medical evacuation." },
    { title: "Missing Child Alert - Kibera", module: "lifemesh", severity: "critical", location: "Kibera Solar Hub", status: "active", description: "Child Amara Osei (8yrs) reported missing. Search teams deployed. Contact Kwame Osei." },
    { title: "Tropical Storm Landfall Warning", module: "earthshield", severity: "critical", location: "East African Coast, Kenya", status: "active", description: "Category 3 storm expected within 48 hours. Coastal community evacuations ordered." },
    { title: "Major Flooding - Niger Delta", module: "earthshield", severity: "critical", location: "Niger River Basin, Nigeria", status: "active", description: "340,000+ people affected by unprecedented Niger River flooding. Emergency response activated." },
    { title: "Grid Instability - Dakar School", module: "energy", severity: "warning", location: "Dakar Learning Institute", status: "active", description: "Solar inverter showing fault codes. Battery charging efficiency reduced by 42%." },
    { title: "Low Battery - Kigali Health Post", module: "energy", severity: "warning", location: "Kigali Health Post", status: "acknowledged", description: "Battery level at 34.7%. Medical equipment on priority power allocation." },
    { title: "Elderly At-Risk - Dakar", module: "lifemesh", severity: "warning", location: "Dakar Learning Institute", status: "active", description: "Oumar Diallo (82yrs) cardiac medication critically low. Medical transport requested." },
    { title: "Shelter Overcapacity Warning", module: "lifemesh", severity: "warning", location: "Mombasa Coastal Shelter", status: "active", description: "Shelter at 142% capacity. Additional facilities required urgently." },
    { title: "Sahel Drought Monitor", module: "earthshield", severity: "warning", location: "Sahel Region, Senegal", status: "active", description: "Food security index at critical levels. 890,000 people affected across the Sahel." },
    { title: "Seismic Activity - Rift Valley", module: "earthshield", severity: "warning", location: "East African Rift, Ethiopia", status: "acknowledged", description: "Repeated tremors M4.1-4.8 detected. Infrastructure stress monitoring activated." },
    { title: "Inverter Fault - Dakar School", module: "energy", severity: "warning", location: "Dakar Learning Institute", status: "acknowledged", description: "Solar inverter Unit 2 reporting fault code E-047. Maintenance scheduled." },
    { title: "Security Incident Resolved - Lagos", module: "lifemesh", severity: "info", location: "Lagos District Command", status: "resolved", description: "Security perimeter breach resolved. All systems secure. No casualties." },
    { title: "Lake Victoria Water Level", module: "earthshield", severity: "info", location: "Lake Victoria Basin, Uganda", status: "acknowledged", description: "Lake levels 0.8m above seasonal average. Routine monitoring in progress." },
  ]);

  console.log("✅ Inserted unified alerts");

  await db.insert(usersTable).values([
    { name: "Dr. Amara Diallo", email: "a.diallo@denarixx.org", role: "admin", organization: "Denarixx OneEarth Global", status: "active", lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { name: "Kwame Asante-Mensah", email: "k.asante@denarixx.org", role: "admin", organization: "Denarixx OneEarth Global Operations", status: "active", lastLogin: new Date(Date.now() - 30 * 60 * 1000) },
    { name: "Fatima Al-Rashid", email: "f.rashid@denarixx.org", role: "operator", organization: "Denarixx Energy - East Africa Hub", status: "active", lastLogin: new Date(Date.now() - 4 * 60 * 60 * 1000) },
    { name: "Emmanuel Okonkwo", email: "e.okonkwo@denarixx.org", role: "operator", organization: "Denarixx LifeMesh - Nigeria", status: "active", lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000) },
    { name: "Aissatou Balde", email: "a.balde@denarixx.org", role: "operator", organization: "Denarixx EarthShield - West Africa Hub", status: "active", lastLogin: new Date(Date.now() - 6 * 60 * 60 * 1000) },
    { name: "Grace Nakato-Ssemanda", email: "g.nakato@family.ug", role: "family", organization: "Private - Kampala", status: "active", lastLogin: new Date(Date.now() - 12 * 60 * 60 * 1000) },
    { name: "Kofi Boateng", email: "k.boateng@family.gh", role: "family", organization: "Private - Accra", status: "active", lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { name: "Commissioner James Otieno", email: "j.otieno@gov.ke", role: "government", organization: "Kenya National Emergency Management", status: "active", lastLogin: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    { name: "Minister Adwoa Sarpong", email: "a.sarpong@gov.gh", role: "government", organization: "Ghana Disaster Management Authority", status: "active", lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { name: "Director Thierno Bah", email: "t.bah@gov.sn", role: "government", organization: "Senegal Civil Protection", status: "inactive", lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  ]);

  console.log("✅ Inserted users");

  console.log("🎉 Database seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
