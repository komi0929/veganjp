import { NextResponse } from 'next/server';
import {
  getGrowthState,
  runSelfHealingDiagnostics,
  recordTelemetryOrIssue,
  incrementGrowthMetric,
} from '@/lib/growth-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const state = getGrowthState();
  return NextResponse.json({ ok: true, ...state });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === 'run_diagnostics') {
      const result = runSelfHealingDiagnostics();
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === 'report_issue' || action === 'auto_heal_event') {
      const ev = recordTelemetryOrIssue({
        category: body.category || 'user_bug_report',
        title_ja: body.title_ja || '不具合・データ修正レポート',
        detail_ja: body.detail_ja || '',
        auto_action_taken: body.auto_action_taken,
        page_url: body.page_url || '/',
      });
      const state = getGrowthState();
      return NextResponse.json({ ok: true, event: ev, state });
    }

    if (action === 'track_metric') {
      const state = incrementGrowthMetric(
        body.metric || 'instagram_story_downloads'
      );
      return NextResponse.json({ ok: true, state });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Internal Error' },
      { status: 500 }
    );
  }
}
