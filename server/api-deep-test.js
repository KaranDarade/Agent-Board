// Autonomous Backend & Boundary API Test Suite
// Executes comprehensive validation against all Agent Board endpoints

const BASE_URL = 'http://localhost:3001';

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function record(name, pass, details = '') {
  if (pass) {
    results.passed++;
    console.log(`  ✅ PASS: ${name} ${details ? '(' + details + ')' : ''}`);
    results.tests.push({ name, status: 'PASS', details });
  } else {
    results.failed++;
    console.error(`  ❌ FAIL: ${name} - ${details}`);
    results.tests.push({ name, status: 'FAIL', details });
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, headers: res.headers, data };
}

async function runApiTests() {
  console.log('\n--- 1. SYSTEM & HEALTH ENDPOINTS ---');
  {
    const res = await request('/api/health');
    record('GET /api/health returns 200', res.status === 200);
    record('GET /api/health contains ok status', res.data?.status === 'ok');
    record('GET /api/health contains uptime number', typeof res.data?.uptime === 'number' && !isNaN(res.data.uptime));
  }

  {
    const res = await request('/api/network');
    record('GET /api/network returns 200', res.status === 200);
    record('GET /api/network contains localIp and port', typeof res.data?.localIp === 'string' && res.data?.port === 3001);
    record('GET /api/network contains valid mobileUrl', res.data?.mobileUrl?.startsWith('http://'));
  }

  {
    const res = await request('/api/tools');
    record('GET /api/tools returns 200', res.status === 200);
    record('GET /api/tools returns array of engines', Array.isArray(res.data) && res.data.length > 0);
  }

  {
    const res = await request('/api/models');
    record('GET /api/models returns 200', res.status === 200);
    record('GET /api/models contains catalog array', Array.isArray(res.data) && res.data.length >= 5);
  }

  {
    const res = await request('/api/workspaces');
    record('GET /api/workspaces returns 200', res.status === 200);
    record('GET /api/workspaces returns array', Array.isArray(res.data));
  }

  {
    const res = await request('/api/cloud/status');
    record('GET /api/cloud/status returns 200', res.status === 200);
    record('GET /api/cloud/status reports configured flag', typeof res.data?.configured === 'boolean');
  }

  console.log('\n--- 2. FLEET METRICS & KPI INTEGRITY ---');
  {
    const res = await request('/api/stats');
    record('GET /api/stats returns 200', res.status === 200);
    record('GET /api/stats totalSessions is valid number', typeof res.data?.totalSessions === 'number' && !isNaN(res.data.totalSessions));
    record('GET /api/stats activeSessions is valid number', typeof res.data?.activeSessions === 'number' && !isNaN(res.data.activeSessions));
    record('GET /api/stats totalCost is valid number', typeof res.data?.totalCost === 'number' && !isNaN(res.data.totalCost));
    record('GET /api/stats totalTokens is valid number', typeof res.data?.totalTokens === 'number' && !isNaN(res.data.totalTokens));
    record('GET /api/stats toolBreakdown exists', typeof res.data?.toolBreakdown === 'object');
  }

  console.log('\n--- 3. FLEET SESSIONS & QUERY FILTERING ---');
  let firstValidSessionId = null;
  {
    const res = await request('/api/sessions');
    record('GET /api/sessions returns 200', res.status === 200);
    record('GET /api/sessions returns array', Array.isArray(res.data));
    if (res.data.length > 0) {
      firstValidSessionId = res.data[0].id;
      record('Session item contains id and tool', !!res.data[0].id && !!res.data[0].tool);
    }
  }

  {
    const res = await request('/api/sessions?tool=opencode');
    record('GET /api/sessions?tool=opencode returns 200', res.status === 200);
    const allMatch = Array.isArray(res.data) && res.data.every(s => s.tool === 'opencode');
    record('Filtered sessions all match tool=opencode', allMatch, `${res.data.length} found`);
  }

  {
    const res = await request('/api/sessions?search=test');
    record('GET /api/sessions?search=test returns 200', res.status === 200);
    record('Search query response is array', Array.isArray(res.data));
  }

  console.log('\n--- 4. SESSION CRUD LIFECYCLE ---');
  let testSessionId = null;
  {
    const res = await request('/api/sessions/create', {
      method: 'POST',
      body: JSON.stringify({
        title: 'QA_AUTOMATED_TEST_SESSION',
        directory: process.cwd(),
        agentRole: 'plan',
        modelObj: { id: 'deepseek-v4.1-flash', providerID: 'opencode-go', variant: 'default' },
        initialTasks: [{ content: 'Init test task', priority: 'high' }]
      })
    });
    record('POST /api/sessions/create returns 201', res.status === 201);
    testSessionId = res.data?.id;
    record('Created session has valid ses_ prefix', !!testSessionId && testSessionId.startsWith('ses_'), testSessionId);
    record('Created session role is plan', res.data?.role === 'plan');
  }

  if (testSessionId) {
    {
      const res = await request(`/api/sessions/${testSessionId}`);
      record('GET /api/sessions/:id returns 200 for new session', res.status === 200);
      record('GET /api/sessions/:id matches created title', res.data?.title === 'QA_AUTOMATED_TEST_SESSION');
      record('GET /api/sessions/:id has directives array', Array.isArray(res.data?.directives));
    }

    {
      const res = await request(`/api/sessions/${testSessionId}/mode`, {
        method: 'POST',
        body: JSON.stringify({ mode: 'build' })
      });
      record('POST /api/sessions/:id/mode switches to build (200)', res.status === 200);
      record('Mode switch returns success', res.data?.success === true);

      // Verify mode persisted
      const verifyRes = await request(`/api/sessions/${testSessionId}`);
      record('Session detail reflects updated mode "build"', verifyRes.data?.role === 'build' || verifyRes.data?.agent === 'build');

      // Switch back
      const revertRes = await request(`/api/sessions/${testSessionId}/mode`, {
        method: 'POST',
        body: JSON.stringify({ mode: 'plan' })
      });
      record('POST /api/sessions/:id/mode reverts to plan (200)', revertRes.status === 200);
    }

    {
      const res = await request(`/api/sessions/${testSessionId}/model`, {
        method: 'POST',
        body: JSON.stringify({
          modelObj: { id: 'claude-3-5-sonnet', providerID: 'anthropic', variant: 'high' }
        })
      });
      record('POST /api/sessions/:id/model updates model (200)', res.status === 200);
      record('Model switch returns success', res.data?.success === true);
    }

    console.log('\n--- 5. TASK MANAGEMENT (TODOS) ---');
    let createdTaskId = null;
    {
      const res = await request(`/api/sessions/${testSessionId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          content: 'E2E Automated Task Item',
          priority: 'urgent'
        })
      });
      record('POST /api/sessions/:id/tasks creates task (201)', res.status === 201);
      createdTaskId = res.data?.id;
      record('Task object contains id & content', !!createdTaskId && res.data?.content === 'E2E Automated Task Item');
    }

    if (createdTaskId) {
      const res = await request(`/api/sessions/${testSessionId}/tasks/${createdTaskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'completed',
          priority: 'low'
        })
      });
      record('PATCH /api/sessions/:id/tasks/:taskId updates task status (200)', res.status === 200);

      const delRes = await request(`/api/sessions/${testSessionId}/tasks/${createdTaskId}`, {
        method: 'DELETE'
      });
      record('DELETE /api/sessions/:id/tasks/:taskId removes task (200)', delRes.status === 200);
    }

    console.log('\n--- 6. ARCHIVE & REACTIVATION ---');
    {
      const res = await request(`/api/sessions/${testSessionId}/deactivate`, {
        method: 'POST',
        body: JSON.stringify({ tool: 'opencode' })
      });
      record('POST /api/sessions/:id/deactivate archives session (200)', res.status === 200);
      record('Deactivate result reflects archived: true', res.data?.archived === true);

      const actRes = await request(`/api/sessions/${testSessionId}/activate`, {
        method: 'POST',
        body: JSON.stringify({ tool: 'opencode' })
      });
      record('POST /api/sessions/:id/activate reactivates session (200)', actRes.status === 200);
      record('Activate result reflects archived: false', actRes.data?.archived === false);
    }

    console.log('\n--- 7. CLEANUP TEST SESSION ---');
    {
      const res = await request(`/api/sessions/${testSessionId}`, {
        method: 'DELETE'
      });
      record('DELETE /api/sessions/:id cleans up test session (200)', res.status === 200);
    }
  }

  console.log('\n--- 8. BOUNDARY, SECURITY & ERROR HANDLING ---');
  {
    const res = await request('/api/sessions/non_existent_fake_ses_999999');
    record('GET non-existent session returns 404', res.status === 404);
  }

  {
    const res = await request('/api/sessions/any_id/prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt: '   ' })
    });
    record('POST /prompt with empty whitespace prompt returns 400', res.status === 400);
  }

  {
    const res = await request('/api/non_existent_endpoint_xyz_123');
    record('GET arbitrary invalid endpoint returns 404', res.status === 404);
  }

  {
    const sqlInjection = encodeURIComponent("' OR '1'='1' --");
    const res = await request(`/api/sessions?search=${sqlInjection}`);
    record('SQL injection string in search query handled safely (200)', res.status === 200 && Array.isArray(res.data));
  }

  {
    const res = await request('/api/download/desktop');
    record('GET /api/download/desktop handles installer request (200 or 404 pending)', res.status === 200 || res.status === 404, `Status: ${res.status}`);
  }

  console.log(`\n========================================`);
  console.log(`API TEST RESULTS: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log(`========================================\n`);

  if (results.failed > 0) {
    process.exit(1);
  }
}

runApiTests().catch(err => {
  console.error('Test execution failed with fatal error:', err);
  process.exit(1);
});
