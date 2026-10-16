import { NextRequest, NextResponse } from 'next/server';
import {
  getEcosystemDb,
  addGratitudeNoteToDb,
  replyToGratitudeNoteInDb,
  upsertStoreOfficialDataInDb,
  registerOrAuthenticatePartner,
  requestStoreVerificationOtp,
  confirmStoreVerificationOtp,
} from '@/lib/server-db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getEcosystemDb();
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get('placeId');

  if (placeId) {
    return NextResponse.json({
      store: db.stores[placeId] || null,
      gratitude_notes: db.gratitude_notes.filter((n) => n.place_id === placeId),
    });
  }

  return NextResponse.json({
    stores: db.stores,
    gratitude_notes: db.gratitude_notes,
    custom_places: db.custom_places,
    partners: db.partners.map((p) => ({
      id: p.id,
      email: p.email,
      owner_name: p.owner_name,
      role_title: p.role_title,
      claimed_place_ids: p.claimed_place_ids,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'send_gratitude') {
      const note = addGratitudeNoteToDb({
        place_id: body.place_id,
        place_name: body.place_name,
        stamp: body.stamp || 'saved_trip',
        stamp_emoji: body.stamp_emoji || '💚',
        stamp_title_en: body.stamp_title_en || 'You Saved My Trip!',
        stamp_title_ja: body.stamp_title_ja || '日本旅行の救世主です！',
        sender_name: body.sender_name || 'A Grateful Traveler',
        sender_country: body.sender_country || 'Global 🌏',
        message_original: body.message_original || '',
        ordered_dishes: body.ordered_dishes || [],
      });
      return NextResponse.json({ ok: true, note });
    }

    if (action === 'reply_gratitude') {
      const updated = replyToGratitudeNoteInDb({
        note_id: body.note_id,
        text_ja: body.text_ja,
        text_en: body.text_en,
        chef_name: body.chef_name,
      });
      if (!updated) {
        return NextResponse.json({ ok: false, error: 'Note not found' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, note: updated });
    }

    if (action === 'update_store') {
      const updatedStore = upsertStoreOfficialDataInDb({
        place_id: body.place_id,
        owner_id: body.owner_id || 'partner-custom',
        owner_name: body.owner_name || '店舗オーナー',
        role_title: body.role_title,
        verification_cert: body.verification_cert,
        chef_greeting_ja: body.chef_greeting_ja,
        chef_greeting_en: body.chef_greeting_en,
        welcome_perk_ja: body.welcome_perk_ja,
        welcome_perk_en: body.welcome_perk_en,
        live_status: body.live_status,
        kitchen_audit: body.kitchen_audit,
        verified_menu: body.verified_menu,
        reservation_url: body.reservation_url,
        custom_place_data: body.custom_place_data,
      });
      return NextResponse.json({ ok: true, store: updatedStore });
    }

    if (action === 'request_verification_otp') {
      const result = requestStoreVerificationOtp({
        place_id: body.place_id,
        method: body.method || 'instagram_official',
        identifier: body.identifier || '@official_account',
        owner_name: body.owner_name || '店舗オーナー',
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === 'confirm_verification_otp') {
      const result = confirmStoreVerificationOtp({
        place_id: body.place_id,
        otp_code: body.otp_code || '',
      });
      if (!result.ok) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result);
    }

    if (action === 'partner_auth') {
      const res = registerOrAuthenticatePartner({
        mode: body.mode || 'login',
        email: body.email || '',
        password: body.password || '',
        owner_name: body.owner_name,
        role_title: body.role_title,
        claim_place_id: body.claim_place_id,
      });
      if (!res.ok) {
        return NextResponse.json(res, { status: 400 });
      }
      return NextResponse.json(res);
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
