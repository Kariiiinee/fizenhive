import { NextResponse } from 'next/server';
import { LabService } from '@/lib/lab/lab-service';
import { REGION_UNIVERSES } from '@/lib/constants';

const labService = new LabService();

export async function POST(request: Request) {
    try {
        const { country } = await request.json();

        if (country) {
            const tickers = REGION_UNIVERSES[country];
            if (!tickers) return NextResponse.json({ error: 'Unsupported country' }, { status: 400 });

            console.log(`Starting Lab Scan for ${country}...`);
            const results = await labService.runDiscovery(country, tickers);
            return NextResponse.json({ success: true, country, count: tickers.length, resultsCount: results.rankings.length });
        } else {
            // Scan all
            const summaries = [];
            for (const region of Object.keys(REGION_UNIVERSES)) {
                console.log(`Starting Lab Scan for ${region}...`);
                const results = await labService.runDiscovery(region, REGION_UNIVERSES[region]);
                summaries.push({ country: region, count: results.rankings.length });
            }
            return NextResponse.json({ success: true, all: summaries });
        }
    } catch (error) {
        console.error('API Lab Scan Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
