import { z } from 'zod';
import {
  createSupabaseDbAdapter,
  parseJsonBody,
  recordAuditLog,
  requirePermission,
  type DbAdapter,
  type ServerRequest,
  type ServerResponse,
} from './_lib/db.ts';

const scoreSchema = z.object({
  id: z.string().trim().min(1),
  optionAScore: z.number().min(1).max(5).nullable(),
  optionBScore: z.number().min(1).max(5).nullable(),
  testRunRef: z.string().trim().optional(),
});

const taskSchema = z.object({
  id: z.string().trim().optional(),
  taskCode: z.string().trim().max(32).optional(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(1500).optional(),
  track: z.string().trim().min(2).max(120),
  workstream: z.string().trim().max(120).optional(),
  owner: z.string().trim().min(2).max(120),
  supportingMembers: z.array(z.string().trim()).optional(),
  priority: z.enum(['P0', 'P1', 'P2']).default('P1'),
  status: z.enum(['todo', 'in_progress', 'blocked', 'done']).default('todo'),
  startDate: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
  acceptanceCriteria: z.string().trim().max(800).optional(),
  evidenceAttachment: z.string().trim().max(400).optional(),
  reviewer: z.string().trim().max(120).optional(),
});

const turbineSchema = z.object({
  turbineCode: z.string().trim().min(2).max(64),
  prototypeVersion: z.string().trim().min(2).max(120),
  rotorDiameterM: z.number().positive().max(20).optional(),
  sweptAreaM2: z.number().positive().max(100).optional(),
  bladeGeometry: z.string().trim().max(200).optional(),
  gearArchitecture: z.string().trim().max(200).optional(),
  gearRatio: z.string().trim().max(80).optional(),
  generatorDetails: z.string().trim().max(200).optional(),
  generatorRating: z.string().trim().max(120).optional(),
  frameMaterial: z.string().trim().max(160).optional(),
  bearingConfig: z.string().trim().max(160).optional(),
  buildDate: z.string().trim().optional(),
  modificationHistory: z.string().trim().max(1000).optional(),
  controllerDetails: z.string().trim().max(200).optional(),
  installationSite: z.string().trim().max(160).optional(),
  sensorConfiguration: z.string().trim().max(200).optional(),
});

export function createAdminHandler(dbFactory: () => DbAdapter = createSupabaseDbAdapter) {
  return async function handler(req: ServerRequest, res: ServerResponse) {
    const db = dbFactory();
    if (!db.isConfigured()) {
      return res.status(503).json({
        error: 'Database unconfigured',
        message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured on this server.',
      });
    }

    const actor = await db.resolveActor(req);
    if (!actor) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const bodyParse = parseJsonBody(req);
    if (!bodyParse.ok) {
      return res.status(400).json({ error: bodyParse.error });
    }
    const body = bodyParse.data;
    const action = String(body.action || req.query?.action || '');

    if (req.method === 'GET') {
      if (action === 'financials') {
        const perm = requirePermission(actor, 'view_financials_bom');
        if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
        const [bom, scenarios] = await Promise.all([
          db.selectRows('bom_items', {}, 200),
          db.selectRows('financial_scenarios', {}, 50),
        ]);
        return res.status(200).json({ bomItems: bom.data, financialScenarios: scenarios.data });
      }

      if (action === 'grants_dataroom') {
        const perm = requirePermission(actor, 'view_grants_dataroom');
        if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
        const [grants, apps, docs, patents] = await Promise.all([
          db.selectRows('grants', {}, 50),
          db.selectRows('grant_applications', {}, 50),
          db.selectRows('product_documents', {}, 150),
          db.selectRows('patents', {}, 20),
        ]);
        const filteredDocs = requirePermission(actor, 'view_private_documents').ok
          ? docs.data
          : docs.data.filter((d: any) => d.visibility === 'public');
        return res.status(200).json({ grants: grants.data, applications: apps.data, documents: filteredDocs, patents: patents.data });
      }

      if (action === 'audit_logs') {
        const perm = requirePermission(actor, 'view_audit_logs');
        if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
        const { data } = await db.selectRows('audit_logs', {}, 250);
        return res.status(200).json({ auditLogs: data });
      }

      const engPerm = requirePermission(actor, 'view_engineering_dashboard');
      if (!engPerm.ok) return res.status(engPerm.status).json({ error: engPerm.error });
      const [tasks, comparisons, patents, turbines] = await Promise.all([
        db.selectRows('tasks', {}, 200),
        db.selectRows('option_comparisons', {}, 50),
        db.selectRows('patents', {}, 20),
        db.selectRows('turbines', {}, 50),
      ]);
      return res.status(200).json({
        tasks: tasks.data,
        optionComparisons: comparisons.data,
        patents: patents.data,
        turbines: turbines.data,
      });
    }

    if (req.method === 'POST' || req.method === 'PATCH') {
      if (action === 'upsert_turbine') {
        const perm = requirePermission(actor, 'edit_engineering_records');
        if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
        const parsed = turbineSchema.safeParse(body);
        if (!parsed.success) {
          return res.status(400).json({ error: 'Invalid turbine configuration payload.' });
        }
        const t = parsed.data;
        const { data, error } = await db.insertRow('turbines', {
          turbine_code: t.turbineCode,
          prototype_version: t.prototypeVersion,
          rotor_diameter_m: t.rotorDiameterM ?? null,
          swept_area_m2: t.sweptAreaM2 ?? null,
          blade_geometry: t.bladeGeometry || null,
          gear_architecture: t.gearArchitecture || null,
          gear_ratio: t.gearRatio || null,
          generator_details: t.generatorDetails || null,
          generator_rating: t.generatorRating || null,
          frame_material: t.frameMaterial || null,
          bearing_config: t.bearingConfig || null,
          build_date: t.buildDate || null,
          modification_history: t.modificationHistory || null,
          controller_details: t.controllerDetails || null,
          installation_site: t.installationSite || 'VNIT Nagpur',
          sensor_configuration: t.sensorConfiguration || 'Monitoring Only',
          safety_status: 'monitoring_only_no_remote_actuation',
          operational_state: 'bench_idle',
        });
        if (error) return res.status(500).json({ error });
        await recordAuditLog(db, actor, 'upsert_turbine', 'turbine', data?.id ?? null, { turbineCode: t.turbineCode });
        return res.status(201).json({ turbine: data });
      }

      if (action === 'score_option_comparison') {
        const perm = requirePermission(actor, 'edit_engineering_records');
        if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
        const parsed = scoreSchema.safeParse(body);
        if (!parsed.success) {
          return res.status(400).json({ error: 'Scores must be valid numeric values between 1 and 5 or null.' });
        }
        const { data } = await db.updateRows(
          'option_comparisons',
          { id: parsed.data.id },
          {
            option_a_score: parsed.data.optionAScore,
            option_b_score: parsed.data.optionBScore,
            updated_at: new Date().toISOString(),
          }
        );
        await recordAuditLog(db, actor, 'score_option_comparison', 'option_comparison', parsed.data.id, {
          optionAScore: parsed.data.optionAScore,
          optionBScore: parsed.data.optionBScore,
          testRunRef: parsed.data.testRunRef || 'unlinked',
        });
        return res.status(200).json({ updated: data });
      }

      if (action === 'upsert_task' || action === 'update_task') {
        const perm = requirePermission(actor, 'edit_engineering_records');
        if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
        const parsed = taskSchema.safeParse(body);
        if (!parsed.success) {
          return res.status(400).json({ error: 'Invalid task payload.' });
        }
        const tk = parsed.data;
        if (tk.id) {
          const patch: Record<string, unknown> = {
            status: tk.status,
            updated_at: new Date().toISOString(),
          };
          if (tk.status === 'done') patch.completed_at = new Date().toISOString();
          if (tk.evidenceAttachment !== undefined) patch.evidence_attachment = tk.evidenceAttachment;
          if (tk.reviewer !== undefined) patch.reviewer = tk.reviewer;
          const { data, error } = await db.updateRows('tasks', { id: tk.id }, patch);
          if (error) return res.status(500).json({ error });
          await recordAuditLog(db, actor, 'update_task', 'task', tk.id, { status: tk.status });
          return res.status(200).json({ task: data[0] || null });
        }

        const { data, error } = await db.insertRow('tasks', {
          task_code: tk.taskCode || `TASK-${Date.now().toString().slice(-4)}`,
          title: tk.title,
          description: tk.description || '',
          track: tk.track,
          workstream: tk.workstream || tk.track,
          owner: tk.owner,
          supporting_members: tk.supportingMembers || [],
          priority: tk.priority,
          start_date: tk.startDate || null,
          due_date: tk.dueDate || null,
          status: tk.status,
          acceptance_criteria: tk.acceptanceCriteria || '',
          evidence_attachment: tk.evidenceAttachment || null,
          reviewer: tk.reviewer || actor.email,
        });
        if (error) return res.status(500).json({ error });
        await recordAuditLog(db, actor, 'create_task', 'task', data?.id ?? null);
        return res.status(201).json({ task: data });
      }

      if (action === 'toggle_document_visibility') {
        const perm = requirePermission(actor, 'manage_cms_and_roles');
        if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
        const docId = String(body.id || '');
        const vis = body.visibility === 'public' ? 'public' : 'private';
        if (!docId) return res.status(400).json({ error: 'Document id required.' });
        const { data } = await db.updateRows('product_documents', { id: docId }, { visibility: vis });
        await recordAuditLog(db, actor, 'toggle_document_visibility', 'product_document', docId, { visibility: vis });
        return res.status(200).json({ updated: data });
      }

      if (action === 'upsert_patent') {
        const perm = requirePermission(actor, 'manage_cms_and_roles');
        if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
        const patentId = String(body.id || '');
        const legalStatus = String(body.legalStatus || 'Published Application — Under Examination (Not Granted)');
        const patch: Record<string, unknown> = {
          application_number: body.applicationNumber ? String(body.applicationNumber) : null,
          publication_number: body.publicationNumber ? String(body.publicationNumber) : null,
          legal_status: legalStatus,
          updated_at: new Date().toISOString(),
        };
        if (patentId) {
          const { data } = await db.updateRows('patents', { id: patentId }, patch);
          await recordAuditLog(db, actor, 'update_patent', 'patent', patentId, patch);
          return res.status(200).json({ patent: data[0] || null });
        }
        const { data, error } = await db.insertRow('patents', {
          title: String(body.title || 'Compact Wind Turbine with Planetary Gears'),
          inventor: String(body.inventor || 'Koyaneni Yaswanth'),
          applicant: String(body.applicant || 'Koyaneni Yaswanth'),
          published_year: Number(body.publishedYear || 2025),
          ...patch,
        });
        if (error) return res.status(500).json({ error });
        await recordAuditLog(db, actor, 'create_patent', 'patent', data?.id ?? null, patch);
        return res.status(201).json({ patent: data });
      }

      if (action === 'save_bom_scenario') {
        const perm = requirePermission(actor, 'edit_financials_bom');
        if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
        const { data, error } = await db.insertRow('financial_scenarios', {
          name: String(body.name || 'BOM Scenario'),
          batch_size: Number(body.batchSize || 1),
          unit_bom_inr: Number(body.unitBomInr || 48000),
          assembly_logistics_inr: Number(body.assemblyLogisticsInr || 0),
          proposed_sale_price_inr: body.proposedSalePriceInr ? Number(body.proposedSalePriceInr) : null,
          monthly_burn_inr: Number(body.monthlyBurnInr || 0),
          cash_balance_inr: Number(body.cashBalanceInr || 0),
          funding_received_inr: Number(body.fundingReceivedInr || 0),
          assumptions_note: String(body.assumptionsNote || 'Commercial assumption'),
        });
        if (error) return res.status(500).json({ error });
        await recordAuditLog(db, actor, 'save_financial_scenario', 'financial_scenario', data?.id ?? null);
        return res.status(201).json({ scenario: data });
      }

      if (action === 'save_monthly_report') {
        const perm = requirePermission(actor, 'manage_cms_and_roles');
        if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
        const { data, error } = await db.insertRow('monthly_reports', {
          report_month: String(body.reportMonth || new Date().toISOString().slice(0, 7)),
          pillars_json: body.pillars || {},
          commentary: String(body.commentary || ''),
          created_by: actor.email,
        });
        if (error) return res.status(500).json({ error });
        await recordAuditLog(db, actor, 'save_monthly_report', 'monthly_report', data?.id ?? null);
        return res.status(201).json({ report: data });
      }

      return res.status(400).json({ error: `Unknown admin action: ${action}` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  };
}

export default createAdminHandler();
