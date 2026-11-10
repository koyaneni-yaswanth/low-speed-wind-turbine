import crypto from 'node:crypto';
import { z } from 'zod';
import {
  createSupabaseDbAdapter,
  recordAuditLog,
  requirePermission,
  type DbAdapter,
  type ServerRequest,
  type ServerResponse,
} from './_lib/db.ts';
import { dispatchEmailNotification } from './notifications.ts';

const VALID_STAGES = new Set([
  'New inquiry',
  'Qualified',
  'Discovery scheduled',
  'Site survey pending',
  'Site survey completed',
  'Technical evaluation',
  'Proposal sent',
  'LOI under review',
  'LOI signed',
  'Pilot approved',
  'Pilot installed',
  'Pilot active',
  'Pilot completed',
  'Commercial negotiation',
  'Won',
  'Lost',
  'On hold',
]);

const submissionSchema = z.object({
  type: z.enum(['pilot_application', 'contact']).default('pilot_application'),
  organizationName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional(),
  siteLocation: z.string().trim().min(2).max(160),
  applicationType: z.string().trim().min(2).max(160),
  roofOrLandType: z.string().trim().min(2).max(120),
  availableMountingAreaSqM: z.number().nonnegative().max(10000).optional(),
  hasExistingSolar: z.boolean().default(false),
  hasExistingBatteryOrInverter: z.boolean().default(false),
  approximateWindInfo: z.string().trim().max(300).optional(),
  energyRequirementKwhDay: z.number().nonnegative().max(10000).optional(),
  desiredTimeline: z.string().trim().max(120).optional(),
  additionalComments: z.string().trim().max(2000).optional(),
  consentToContact: z.literal(true),
  honeypot: z.string().optional(),
});

const patchLeadSchema = z.object({
  leadId: z.string().trim().min(4),
  toStage: z.string().trim().optional(),
  notes: z.string().trim().max(1500).optional(),
  painPoints: z.string().trim().max(500).optional(),
  nextAction: z.string().trim().max(300).optional(),
  followUpDate: z.string().trim().optional(),
  currentEnergyCostInrKwh: z.number().nonnegative().optional(),
  surveyScheduledAt: z.string().trim().optional(),
  proposalRef: z.string().trim().max(120).optional(),
  loiRef: z.string().trim().max(120).optional(),
});

export function createInquiriesHandler(dbFactory: () => DbAdapter = createSupabaseDbAdapter) {
  return async function handler(req: ServerRequest, res: ServerResponse) {
    const db = dbFactory();
    if (!db.isConfigured()) {
      return res.status(503).json({
        error: 'Database unconfigured',
        message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured on this server. No submission was simulated.',
      });
    }

    if (req.method === 'POST') {
      const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};
      if (typeof body.honeypot === 'string' && body.honeypot.trim().length > 0) {
        // Spam trap: reject silently or return 400
        return res.status(400).json({ error: 'Spam check triggered.' });
      }

      const parsed = submissionSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        });
      }

      const d = parsed.data;
      // Duplicate protection check for active email+org inquiry within recent leads
      const { data: existingContacts } = await db.selectRows('contacts', { email: d.email }, 10);
      const isDuplicateEmail = existingContacts.length > 0;

      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const refCode = `PS-${d.type === 'pilot_application' ? 'PILOT' : 'INQ'}-${datePart}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      await db.insertRow('website_inquiries', {
        reference_code: refCode,
        inquiry_type: d.type,
        organization_name: d.organizationName,
        contact_name: d.contactName,
        email: d.email,
        phone: d.phone || null,
        subject: d.applicationType,
        message: d.additionalComments || '',
        consent_to_contact: d.consentToContact,
      });

      const { data: org } = await db.insertRow('organizations', {
        name: d.organizationName,
        segment: d.applicationType,
        city: d.siteLocation,
      });

      const { data: contact } = await db.insertRow('contacts', {
        organization_id: org?.id || null,
        full_name: d.contactName,
        email: d.email,
        phone: d.phone || null,
        consent_to_contact: d.consentToContact,
      });

      if (d.type === 'pilot_application') {
        const { data: assessment } = await db.insertRow('site_assessments', {
          reference_code: refCode,
          organization_id: org?.id || null,
          contact_id: contact?.id || null,
          site_location: d.siteLocation,
          application_type: d.applicationType,
          roof_or_land_type: d.roofOrLandType,
          available_mounting_area_sqm: d.availableMountingAreaSqM ?? null,
          has_existing_solar: d.hasExistingSolar,
          has_existing_battery_or_inverter: d.hasExistingBatteryOrInverter,
          approximate_wind_info: d.approximateWindInfo || null,
          energy_requirement_kwh_day: d.energyRequirementKwhDay ?? null,
          desired_timeline: d.desiredTimeline || null,
          additional_comments: d.additionalComments || null,
        });

        const { data: pilotApp } = await db.insertRow('pilot_applications', {
          reference_code: refCode,
          assessment_id: assessment?.id || null,
          stage: 'New inquiry',
          owner_email: process.env.ADMIN_ALERT_EMAIL || 'koyaneniyaswanth@gmail.com',
        });

        await db.insertRow('leads', {
          organization_id: org?.id || null,
          contact_id: contact?.id || null,
          pilot_application_id: pilotApp?.id || null,
          customer_segment: d.applicationType,
          estimated_demand_kwh_day: d.energyRequirementKwhDay ?? null,
          stage: 'New inquiry',
          next_action: 'Initial engineering review of site assessment',
          owner_email: process.env.ADMIN_ALERT_EMAIL || 'koyaneniyaswanth@gmail.com',
        });
      }

      const emailRes = await dispatchEmailNotification({
        to: d.email,
        subject: `Pawan Shakti Inquiry Received (${refCode})`,
        htmlBody: `<p>Thank you ${d.contactName}. Your reference code is <strong>${refCode}</strong>. Final site suitability awaits technical wind and mounting review.</p>`,
      });

      await db.insertRow('notifications', {
        template_key: d.type === 'pilot_application' ? 'pilot_application_confirmation' : 'contact_confirmation',
        recipient: d.email,
        subject: `Pawan Shakti Inquiry Received (${refCode})`,
        payload: { referenceCode: refCode, isDuplicateEmail },
        delivery_status: emailRes.deliveryStatus,
        provider_response: emailRes.providerResponse,
      });

      return res.status(201).json({
        referenceCode: refCode,
        isDuplicateContact: isDuplicateEmail,
        notificationStatus: emailRes.deliveryStatus,
      });
    }

    if (req.method === 'GET') {
      const actor = await db.resolveActor(req);
      const auth = requirePermission(actor, 'view_crm');
      if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

      const [leadsRes, orgsRes, contactsRes, appsRes, activitiesRes] = await Promise.all([
        db.selectRows('leads', {}, 250),
        db.selectRows('organizations', {}, 250),
        db.selectRows('contacts', {}, 250),
        db.selectRows('pilot_applications', {}, 250),
        db.selectRows('lead_activities', {}, 300),
      ]);

      return res.status(200).json({
        leads: leadsRes.data,
        organizations: orgsRes.data,
        contacts: contactsRes.data,
        pilotApplications: appsRes.data,
        activities: activitiesRes.data,
      });
    }

    if (req.method === 'PATCH') {
      const actor = await db.resolveActor(req);
      const auth = requirePermission(actor, 'edit_crm');
      if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

      const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};
      const parsed = patchLeadSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid CRM lead update payload.' });
      }
      const p = parsed.data;
      if (p.toStage && !VALID_STAGES.has(p.toStage)) {
        return res.status(400).json({ error: `Unsupported pipeline stage: ${p.toStage}` });
      }

      const { data: existingRows } = await db.selectRows('leads', { id: p.leadId }, 1);
      const existingLead = existingRows[0];
      if (!existingLead) {
        return res.status(404).json({ error: 'Lead record not found.' });
      }

      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (p.toStage) patch.stage = p.toStage;
      if (p.painPoints !== undefined) patch.pain_points = p.painPoints;
      if (p.nextAction !== undefined) patch.next_action = p.nextAction;
      if (p.followUpDate !== undefined) patch.follow_up_date = p.followUpDate;
      if (p.currentEnergyCostInrKwh !== undefined) patch.current_energy_cost_inr_kwh = p.currentEnergyCostInrKwh;

      const { data: updated } = await db.updateRows('leads', { id: p.leadId }, patch);

      if (existingLead.pilot_application_id) {
        const appPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (p.toStage) appPatch.stage = p.toStage;
        if (p.surveyScheduledAt) appPatch.survey_scheduled_at = p.surveyScheduledAt;
        if (p.proposalRef) appPatch.proposal_ref = p.proposalRef;
        if (p.loiRef) appPatch.loi_ref = p.loiRef;
        await db.updateRows('pilot_applications', { id: existingLead.pilot_application_id }, appPatch);
      }

      await db.insertRow('lead_activities', {
        lead_id: p.leadId,
        actor_email: actor!.email,
        activity_type: p.toStage ? 'stage_change' : 'note',
        from_stage: existingLead.stage,
        to_stage: p.toStage || existingLead.stage,
        notes: p.notes || '',
      });

      await recordAuditLog(db, actor!, 'update_crm_lead', 'lead', p.leadId, {
        fromStage: existingLead.stage,
        toStage: p.toStage || existingLead.stage,
      });

      return res.status(200).json({ lead: updated[0] || existingLead });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  };
}

export default createInquiriesHandler();
