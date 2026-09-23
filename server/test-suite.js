// Comprehensive End-to-End Test Suite for Agent Board
// Tests: Workspaces, Models, Session Creation (Option B: Review Ready), Mode Switching,
// Model Allocation, Task Management (CRUD), Steering Non-blocking, Activation/Deactivation,
// Antigravity Active Detection, and Session Deletion.

const API_BASE = 'http://127.0.0.1:3001';

async function runTests() {
  console.log('====================================================');
  console.log('      AGENT BOARD - COMPREHENSIVE TEST SUITE        ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  \x1b[32m✔ PASS\x1b[0m: ${message}`);
      passed++;
    } else {
      console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${message}`);
      failed++;
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Health & Server Info
    console.log('[1/10] Testing API Root & Health Check...');
    const healthRes = await fetch(`${API_BASE}/api/health`);
    assert(healthRes.status === 200, 'Health check returns HTTP 200');
    const health = await healthRes.json();
    assert(health.status === 'ok', 'Health status is ok');
    assert(typeof health.serverTime === 'number', `Server time reported: ${health.serverTime}`);

    // 2. Network info for mobile access
    console.log('\n[2/10] Testing Network & Mobile Access Configuration...');
    const netRes = await fetch(`${API_BASE}/api/network`);
    const net = await netRes.json();
    assert(net.localIp !== undefined, `Local network IP detected: ${net.localIp}`);
    assert(net.mobileUrl !== undefined, `Mobile access URL generated: ${net.mobileUrl}`);
    assert(Number(net.port) === 3001, 'Port correctly set to 3001');

    // 3. Workspaces catalog
    console.log('\n[3/10] Testing Workspaces Auto-Discovery...');
    const wsRes = await fetch(`${API_BASE}/api/workspaces`);
    const workspaces = await wsRes.json();
    assert(Array.isArray(workspaces), 'Workspaces endpoint returns an array');
    assert(workspaces.length > 0, `Discovered ${workspaces.length} workspaces`);
    assert(workspaces.some(w => w.path && w.name), 'Workspaces contain valid path and name fields');
    const sampleWorkspace = workspaces[0].path;
    console.log(`  Discovered sample workspace: ${sampleWorkspace}`);

    // 4. Model Catalog
    console.log('\n[4/10] Testing Model Catalog...');
    const modelsRes = await fetch(`${API_BASE}/api/models`);
    const models = await modelsRes.json();
    assert(Array.isArray(models), 'Models list is an array');
    assert(models.length >= 8, `Catalog contains ${models.length} model configurations`);
    assert(models.some(m => m.id === 'deepseek-v4.1-flash'), 'DeepSeek v4.1 Flash preset available');
    assert(models.some(m => m.id === 'claude-3-7-sonnet'), 'Claude 3.7 Sonnet preset available');
    assert(models.some(m => m.id === 'glm-5.3-flash'), 'GLM-5.3 Flash preset available');

    // 5. Session Scanners & Antigravity Active Detection
    console.log('\n[5/10] Testing Universal Session Scanners & Antigravity Active Detection...');
    const sessionsRes = await fetch(`${API_BASE}/api/sessions`);
    const sessions = await sessionsRes.json();
    assert(Array.isArray(sessions), 'Sessions endpoint returns array of sessions');
    console.log(`  Scanned total of ${sessions.length} sessions across tools`);

    const tools = new Set(sessions.map(s => s.tool));
    console.log(`  Connected engine tools: ${Array.from(tools).join(', ')}`);

    const antigravitySessions = sessions.filter(s => s.tool === 'antigravity');
    assert(antigravitySessions.length > 0, `Found ${antigravitySessions.length} Antigravity brain sessions`);
    const activeAntigravity = antigravitySessions.find(s => s.isActive === true);
    assert(activeAntigravity !== undefined, `Antigravity active session accurately detected: ${activeAntigravity?.id}`);
    console.log(`  Active Antigravity Session: "${activeAntigravity?.title}" (isActive: true)`);

    // 6. Session Creation (Option B: Initialized in PLAN mode / Ready for Review)
    console.log('\n[6/10] Testing Session Creation (Option B: Review Ready)...');
    const createRes = await fetch(`${API_BASE}/api/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'E2E Automated Verification Session',
        directory: sampleWorkspace,
        agentRole: 'plan',
        modelObj: { id: 'deepseek-v4.1-flash', providerID: 'opencode-go', variant: 'default' },
        initialTasks: ['Audit component architecture', 'Run regression verification']
      })
    });
    assert(createRes.status === 201, 'Create session returns HTTP 201 Created');
    const createdSession = await createRes.json();
    assert(createdSession.id && createdSession.id.startsWith('ses_'), `Created session ID: ${createdSession.id}`);
    assert(createdSession.role === 'plan', 'Session initialized in PLAN mode');
    assert(createdSession.model === 'deepseek-v4.1-flash', 'Model set to deepseek-v4.1-flash');
    assert(createdSession.initialTasksCount === 2, 'Initial tasks count recorded as 2');

    const testSessionId = createdSession.id;

    // 7. Mode Switching (PLAN ⇄ BUILD)
    console.log('\n[7/10] Testing Mode Switching (PLAN ⇄ BUILD)...');
    const modeBuildRes = await fetch(`${API_BASE}/api/sessions/${testSessionId}/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'build' })
    });
    const modeBuildData = await modeBuildRes.json();
    assert(modeBuildData.success === true, 'Switched mode to BUILD successfully');
    assert(modeBuildData.role === 'build', 'Role confirmed as BUILD');

    const modePlanRes = await fetch(`${API_BASE}/api/sessions/${testSessionId}/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'plan' })
    });
    const modePlanData = await modePlanRes.json();
    assert(modePlanData.success === true, 'Switched mode back to PLAN successfully');
    assert(modePlanData.role === 'plan', 'Role confirmed as PLAN');

    // 8. Model Allocation on the Fly
    console.log('\n[8/10] Testing Model Allocation on the Fly...');
    const modelUpdateRes = await fetch(`${API_BASE}/api/sessions/${testSessionId}/model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelObj: { id: 'claude-3-7-sonnet', providerID: 'anthropic', variant: 'high' }
      })
    });
    const modelUpdateData = await modelUpdateRes.json();
    assert(modelUpdateData.success === true, 'Model updated successfully');
    assert(modelUpdateData.model === 'claude-3-7-sonnet', 'Session model updated to claude-3-7-sonnet');

    // 9. Task Management (Add, Update/Check, Delete)
    console.log('\n[9/10] Testing Task Management (CRUD)...');
    // Add task
    const addTaskRes = await fetch(`${API_BASE}/api/sessions/${testSessionId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Run final smoke tests', priority: 'high' })
    });
    assert(addTaskRes.status === 201, 'Add task returned HTTP 201');
    const addedTask = await addTaskRes.json();
    assert(addedTask.content === 'Run final smoke tests', 'Task content matches');
    assert(addedTask.status === 'pending', 'Initial task status is pending');
    assert(typeof addedTask.position === 'number', `Task assigned position ${addedTask.position}`);

    // Update / Toggle task
    const patchTaskRes = await fetch(`${API_BASE}/api/sessions/${testSessionId}/tasks/${addedTask.position}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });
    const patchedTask = await patchTaskRes.json();
    assert(patchedTask.status === 'completed', 'Task status updated to completed');

    // Delete task
    const deleteTaskRes = await fetch(`${API_BASE}/api/sessions/${testSessionId}/tasks/${addedTask.position}`, {
      method: 'DELETE'
    });
    const deleteResult = await deleteTaskRes.json();
    assert(deleteResult.success === true, 'Task deleted successfully');

    // 10. Non-blocking Steering, Lifecycle, and Teardown
    console.log('\n[10/10] Testing Non-blocking Steering Directive, Deactivate/Reactivate & Cleanup...');
    const steerStart = Date.now();
    const steerRes = await fetch(`${API_BASE}/api/sessions/${testSessionId}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Please verify configuration files.' })
    });
    const steerDuration = Date.now() - steerStart;
    const steerData = await steerRes.json();
    assert(steerRes.status === 200, 'Steering request returned HTTP 200');
    assert(steerData.success === true, 'Steering directive successfully queued');
    assert(steerDuration < 2000, `Steering returned promptly (${steerDuration}ms) without freezing UI`);

    // Deactivate
    const deactRes = await fetch(`${API_BASE}/api/sessions/${testSessionId}/deactivate`, { method: 'POST' });
    const deactData = await deactRes.json();
    assert(deactData.success === true, 'Session deactivated (archived) successfully');

    // Reactivate
    const reactRes = await fetch(`${API_BASE}/api/sessions/${testSessionId}/activate`, { method: 'POST' });
    const reactData = await reactRes.json();
    assert(reactData.success === true, 'Session reactivated successfully');

    // Cleanup: delete test session
    const deleteSessionRes = await fetch(`${API_BASE}/api/sessions/${testSessionId}`, { method: 'DELETE' });
    const deleteSessionData = await deleteSessionRes.json();
    assert(deleteSessionData.success === true, 'Test session cleaned up successfully from database');

    console.log('\n====================================================');
    console.log(`  ALL ${passed} VERIFICATION CHECKS PASSED PERFECTLY!     `);
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n\x1b[31mE2E Test Suite Error:\x1b[0m', err.message);
    process.exit(1);
  }
}

runTests();
