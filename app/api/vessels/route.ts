import { NextResponse } from "next/server"

// Strait of Hormuz bounding box (from the provided coordinates)
const HORMUZ_BOUNDS = {
  lat_min: 26.0,
  lat_max: 27.5,
  lon_min: 55.0,
  lon_max: 57.0,
}

export async function GET() {
  const apiKey = process.env.DATALASTIC_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: "DATALASTIC_API_KEY not configured", demo: true },
      { status: 200 }
    )
  }

  try {
    // Datalastic Vessel In Area API
    const apiUrl = `https://api.datalastic.com/api/v0/vessel_in_area?api_key=${apiKey}&lat_min=${HORMUZ_BOUNDS.lat_min}&lat_max=${HORMUZ_BOUNDS.lat_max}&lon_min=${HORMUZ_BOUNDS.lon_min}&lon_max=${HORMUZ_BOUNDS.lon_max}`

    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Datalastic API error:", response.status, errorText)
      return NextResponse.json(
        { error: "Failed to fetch from Datalastic API", details: errorText, demo: true },
        { status: 200 }
      )
    }

    const result = await response.json()
    
    // Datalastic returns data in result.data
    const data = result.data

    if (!Array.isArray(data)) {
      console.error("Invalid data format from Datalastic:", result)
      return NextResponse.json(
        { error: "Invalid data format received", demo: true },
        { status: 200 }
      )
    }

    // Transform and return the vessel data
    const vessels = data.map((ship: Record<string, unknown>) => {
      const speed = parseFloat(String(ship.sog)) || 0
      
      return {
        mmsi: String(ship.mmsi || ""),
        imo: String(ship.imo || ""),
        name: String(ship.name || ship.ship_name || "Unknown"),
        type: mapShipType(String(ship.type || ship.ship_type || "")),
        flag: String(ship.flag || ship.country_iso || ""),
        lat: Number(ship.lat || ship.latitude) || 0,
        lon: Number(ship.lon || ship.longitude) || 0,
        sog: Math.round(speed * 10) / 10,
        cog: Number(ship.cog || ship.course) || 0,
        heading: Number(ship.heading || ship.cog) || 0,
        destination: String(ship.destination || "Unknown"),
        eta: String(ship.eta || ""),
        cargo: String(ship.cargo || ship.cargo_type || "Not specified"),
        status: determineStatus(speed),
        timestamp: String(ship.last_position_UTC || ship.timestamp || new Date().toISOString()),
      }
    })

    // Calculate summary stats
    const totalVessels = vessels.length
    const tankers = vessels.filter((v: { type: string }) => v.type === "Tanker").length
    const totalSpeed = vessels.reduce((sum: number, v: { sog: number }) => sum + v.sog, 0)
    const avgSpeed = totalVessels > 0 ? Math.round((totalSpeed / totalVessels) * 10) / 10 : 0
    const stoppedCount = vessels.filter((v: { sog: number }) => v.sog < 0.5).length

    return NextResponse.json({
      vessels,
      stats: {
        totalVessels,
        tankers,
        avgSpeed,
        stoppedCount,
      },
      lastUpdate: new Date().toISOString(),
      demo: false,
    })
  } catch (error) {
    console.error("Error fetching vessel data:", error)
    return NextResponse.json(
      { error: "Failed to fetch vessel data", demo: true },
      { status: 200 }
    )
  }
}

// Map Datalastic ship type to our types
function mapShipType(shipType: string): string {
  if (!shipType) return "Other"
  const type = shipType.toLowerCase()
  if (type.includes("tanker")) return "Tanker"
  if (type.includes("cargo")) return "Cargo"
  if (type.includes("container")) return "Container"
  if (type.includes("bulk")) return "Bulk Carrier"
  return "Other"
}

// Determine vessel status based on speed
function determineStatus(speed: number): string {
  if (speed < 0.5) return "Stopped"
  return "In Transit"
}
