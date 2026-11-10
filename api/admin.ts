import {
  createSupabaseDbAdapter,
  recordAuditLog,
  requirePermission,
  type DbAdapter,
  type ServerRequest,
  type ServerResponse,
} from './_lib/db.ts';

export function createAdminHandler(dbFactory: () => DbAdapter = createSupabaseDbAdapter) {
  return async function handler(req: ServerRequest, res: ServerResponse) {
    const db = dbFactory();
    if (!db.isConfigured()) {
      return res.status(503).json({
        error: 'Database unconfigured',
        message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Admin Console writes.',
      });
    }

    const actor = await db.resolveActor(req);
    if (!actor) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const body = ((typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {}) as Record<string, any>;
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
        const [grants, apps, docs] = await Promise.all([
          db.selectRows('grants', {}, 50),
          db.selectRows('grant_applications', {}, 50),
          db.selectRows('product_documents', {}, 150),
        ]);
        const filteredDocs = requirePermission(actor, 'view_private_documents').ok
          ? docs.data
          : docs.data.filter((d: any) => d.visibility === 'public');
        return res.status(200).json({ grants: grants.data, applications: apps.data, documents: filteredDocs });
      }

      if (action === 'audit_logs') {
        const perm = requirePermission(actor, 'view_audit_logs');
        if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
        const { data } = await db.selectRows('audit_logs', {}, 250);
        return res.status(200).json({ auditLogs: data });
      }

      const engPerm = requirePermission(actor, 'view_engineering_dashboard');
      if (!engPerm.ok) return res.status(engPerm.status).json({ error: engPerm.error });
      const [tasks, comparisons, patents] = await Promise.all([
        db.selectRows('tasks', {}, 200),
        db.selectRows('option_comparisons', {}, 50),
        db.selectRows('patents', {}, 20),
      ]);
      return res.status(200).json({ tasks: tasks.data, optionComparisons: comparisons.data, patents: patents.data });
    }

    if (req.method === 'POST' || req.method === 'PATCH') {
      if (action === 'score_option_comparison') {
        const perm = requirePermission(actor, 'edit_engineering_records');
        if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
        const { data } = await db.updateRows(
          'option_comparisons',
          { id: body.id },
          {
            option_a_score: body.optionAScore,
            option_b_score: body.optionBScore,
            updated_at: new Date().toISOString(),
          }
        );
        await recordAuditLog(db, actor, 'score_option_comparison', 'option_comparison', String(body.id || ''), {
          optionAScore: body.optionAScore,
          optionBScore: body.optionBScore,
        });
        return res.status(200).json({ updated: data });
      }

      if (action === 'upsert_task') {
        const perm = requirePermission(actor, 'edit_engineering_records');
        if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
        const { data, error } = await db.insertRow('tasks', {
          title: body.title,
          description: body.description || '',
          track: body.track || 'Engineering',
          owner: body.owner || actor.email,
          priority: body.priority || 'P1',
          status: body.status || 'todo',
          acceptance_criteria: body.acceptanceCriteria || '',
        });
        if (error) return res.status(500).json({ error });
        await recordAuditLog(db, actor, 'create_task', 'task', data?.id ?? null);
        return res.status(201).json({ task: data });
      }

      if (action === 'save_bom_scenario') {
        const perm = requirePermission(actor, 'edit_financials_bom');
        if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
        const { data, error } = await db.insertRow('financial_scenarios', {
          name: body.name,
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
