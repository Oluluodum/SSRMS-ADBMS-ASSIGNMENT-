const rows = document.querySelector('#student-rows');
const notice = document.querySelector('#notice');
const dialog = document.querySelector('#student-dialog');
const form = document.querySelector('#student-form');
const formError = document.querySelector('#form-error');
let currentUser;
let students = [];
let currentPage = 'overview';

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
  });
  if (response.status === 401) {
    window.location.replace('/');
    throw new Error('Please sign in again.');
  }
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Request failed.');
  return data;
}

async function loadStudents(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const result = await api(`/api/students${query}`);
  students = result.students;
  document.querySelector('#student-total').textContent = result.total;
  rows.replaceChildren();
  for (const student of students) {
    const tr = document.createElement('tr');
    for (const value of [student.studentNumber, `${student.firstName} ${student.lastName}`, student.programme, student.email, student.grade ?? '—']) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    }
    const actions = document.createElement('td');
    actions.className = 'actions';
    if (currentUser.role === 'ADMINISTRATOR') {
      actions.append(button('Edit', () => openForm(student)), button('Delete', () => removeStudent(student)));
    } else if (currentUser.role === 'LECTURER') {
      actions.append(button('Update grade', () => openForm(student, true)));
    }
    tr.append(actions);
    rows.append(tr);
  }
  if (!students.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.textContent = 'No student records found.';
    tr.append(td);
    rows.append(tr);
  }
}

function button(text, onClick) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'button quiet';
  element.textContent = text;
  element.addEventListener('click', onClick);
  return element;
}

function openForm(student = null, gradeOnly = false) {
  form.reset();
  formError.textContent = '';
  document.querySelector('#form-title').textContent = gradeOnly ? 'Update student grade' : student ? 'Edit student' : 'Add student';
  for (const [key, value] of Object.entries(student ?? {})) {
    if (form.elements.namedItem(key)) form.elements.namedItem(key).value = value ?? '';
  }
  form.elements.namedItem('id').value = student?.id ?? '';
  for (const name of ['studentNumber', 'firstName', 'lastName', 'programme', 'email']) {
    form.elements.namedItem(name).disabled = gradeOnly;
  }
  form.showModal();
}

async function removeStudent(student) {
  if (!window.confirm(`Delete ${student.firstName} ${student.lastName}? This cannot be undone.`)) return;
  try {
    await api(`/api/students/${student.id}`, { method: 'DELETE' });
    notice.textContent = 'Student deleted.';
    await loadStudents(document.querySelector('#search').value);
  } catch (error) {
    notice.textContent = error.message;
  }
}

async function loadAudit() {
  const { logs } = await api('/api/audit-logs');
  renderAuditRows(document.querySelector('#audit-rows'), logs, true);
  renderAuditRows(document.querySelector('#recent-audit-rows'), logs.slice(0, 5), false);
}

function renderAuditRows(target, logs, includeRole) {
  target.replaceChildren();
  for (const log of logs) {
    const tr = document.createElement('tr');
    const values = [
      new Date(log.createdAt).toLocaleString(),
      log.user?.fullName ?? 'System',
      ...(includeRole ? [log.user?.role?.replace('_', ' ') ?? '—'] : []),
      log.action,
      ...(includeRole ? [log.entity] : []),
      log.entityId ?? '—'
    ];
    for (const value of values) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    }
    target.append(tr);
  }
  if (!logs.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = includeRole ? 6 : 5;
    td.textContent = 'No activity has been recorded yet.';
    tr.append(td);
    target.append(tr);
  }
}

function navigateTo(page) {
  const allowedPages = ['overview', 'students', 'audit'];
  const requestedPage = allowedPages.includes(page) ? page : 'overview';
  if (requestedPage === 'audit' && currentUser.role !== 'ADMINISTRATOR') {
    window.location.hash = 'overview';
    notice.textContent = 'The audit log is available to administrators only.';
    return;
  }

  currentPage = requestedPage;
  document.querySelectorAll('.page-view').forEach((view) => {
    view.classList.toggle('hidden', view.id !== `page-${currentPage}`);
  });
  document.querySelectorAll('.nav-link').forEach((link) => {
    const active = link.dataset.page === currentPage;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  const pageTitles = { overview: 'Overview', students: 'Students', audit: 'Audit log' };
  document.title = `${pageTitles[currentPage]} | SSRMS`;
  if (currentPage === 'students') {
    loadStudents(document.querySelector('#search').value)
      .catch((error) => { notice.textContent = error.message; });
  } else if (currentPage === 'audit') {
    document.querySelector('#audit-notice').textContent = '';
    loadAudit().catch((error) => {
      document.querySelector('#audit-notice').textContent = error.message;
    });
  }
}

document.querySelector('#add-student').addEventListener('click', () => openForm());
document.querySelector('#search').addEventListener('input', (event) => {
  loadStudents(event.target.value).catch((error) => { notice.textContent = error.message; });
});
window.addEventListener('hashchange', () => {
  navigateTo(window.location.hash.slice(1) || 'overview');
});
for (const id of ['close-dialog', 'cancel-dialog']) {
  document.querySelector(`#${id}`).addEventListener('click', () => dialog.close());
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.textContent = '';
  const formData = new FormData(form);
  const id = formData.get('id');
  const gradeOnly = currentUser.role === 'LECTURER';
  const data = gradeOnly
    ? { grade: formData.get('grade') === '' ? null : Number(formData.get('grade')) }
    : Object.fromEntries([...formData].filter(([key, value]) => key !== 'id' && value !== ''));
  if (!gradeOnly) data.grade = data.grade === undefined ? null : Number(data.grade);
  try {
    await api(id ? `/api/students/${id}` : '/api/students', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data)
    });
    dialog.close();
    notice.textContent = id ? 'Student updated.' : 'Student added.';
    await loadStudents(document.querySelector('#search').value);
  } catch (error) {
    formError.textContent = error.message;
  }
});

document.querySelector('#logout').addEventListener('click', async () => {
  try {
    await api('/api/auth/logout', { method: 'POST' });
    window.location.replace('/');
  } catch (error) {
    notice.textContent = error.message;
  }
});

try {
  ({ user: currentUser } = await api('/api/auth/me'));
  document.querySelector('#current-user').textContent = currentUser.fullName;
  document.querySelector('#role-badge').textContent = currentUser.role.replace('_', ' ');
  document.querySelector('#welcome-user').textContent = currentUser.fullName.split(' ')[0];
  document.querySelector('#overview-role').textContent = currentUser.role.replace('_', ' ');
  const actionSummary = {
    ADMINISTRATOR: ['Manage all records', 'Create, edit, delete students, and review audit activity'],
    LECTURER: ['Update grades', 'View student records and update grades only'],
    VIEWER: ['Read-only access', 'Search and view student records']
  };
  document.querySelector('#action-summary').textContent = actionSummary[currentUser.role][0];
  document.querySelector('#action-description').textContent = actionSummary[currentUser.role][1];
  if (currentUser.role === 'ADMINISTRATOR') {
    document.querySelector('#add-student').classList.remove('hidden');
    document.querySelectorAll('[data-admin-only]').forEach((element) => element.classList.remove('hidden'));
    document.querySelector('#recent-activity').classList.remove('hidden');
    await loadAudit();
  }
  await loadStudents();
  navigateTo(window.location.hash.slice(1) || 'overview');
} catch (error) {
  if (error.message !== 'Please sign in again.') notice.textContent = error.message;
}
