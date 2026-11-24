const rows = document.querySelector('#student-rows');
const notice = document.querySelector('#notice');
const dialog = document.querySelector('#student-dialog');
const form = document.querySelector('#student-form');
const formError = document.querySelector('#form-error');
let currentUser;
let students = [];

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
  const auditRows = document.querySelector('#audit-rows');
  auditRows.replaceChildren();
  for (const log of logs) {
    const tr = document.createElement('tr');
    for (const value of [new Date(log.createdAt).toLocaleString(), log.user?.fullName ?? 'System', log.action, log.entityId ?? '—']) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    }
    auditRows.append(tr);
  }
}

document.querySelector('#add-student').addEventListener('click', () => openForm());
document.querySelector('#search').addEventListener('input', (event) => {
  loadStudents(event.target.value).catch((error) => { notice.textContent = error.message; });
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
  if (currentUser.role === 'ADMINISTRATOR') {
    document.querySelector('#add-student').classList.remove('hidden');
    document.querySelector('#audit-panel').classList.remove('hidden');
    await loadAudit();
  }
  await loadStudents();
} catch (error) {
  notice.textContent = error.message;
}
