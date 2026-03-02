import { NextResponse } from 'next/server';
import { LabService } from '@/lib/lab/lab-service';
import { REGION_UNIVERSES } from '@/lib/constants';

const labService = new LabService();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'US';

    const tickers = REGION_UNIVERSES[country];
    if (!tickers) {
        return NextResponse.json({ error: 'Unsupported country' }, { status: 400 });
    }

    try {
        const discovery = await labService.runDiscovery(country, tickers);
        return NextResponse.json(discovery);
    } catch (error) {
        console.error('API Lab Discovery Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
