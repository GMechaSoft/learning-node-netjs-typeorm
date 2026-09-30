/* Smoke test HU #1: flujo CRUD completo contra la API real (PostgreSQL). */
const jwt = require('jsonwebtoken');

const BASE = 'http://localhost:3000/api';
const token = jwt.sign({ sub: '1' }, 'tareas-dev-secret-2026', { expiresIn: '1h' });
const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  return { status: res.status, json };
}

function check(nombre, cond, detalle) {
  if (cond) console.log(`PASS ${nombre}`);
  else {
    console.error(`FAIL ${nombre} :: ${detalle}`);
    process.exitCode = 1;
  }
}

(async () => {
  // Sin token -> 401
  const sinToken = await fetch(BASE + '/tareas');
  check('401 sin token', sinToken.status === 401, `status=${sinToken.status}`);

  // Con token inválido -> 401
  const tokenMal = await fetch(BASE + '/tareas', {
    headers: { Authorization: 'Bearer invalido' },
  });
  check('401 token inválido', tokenMal.status === 401, `status=${tokenMal.status}`);

  // POST válido -> 201
  const crear = await req('POST', '/tareas', {
    titulo: 'Tarea smoke',
    descripcion: 'creada por smoke test',
  });
  check('201 crear', crear.status === 201, `status=${crear.status} body=${JSON.stringify(crear.json)}`);
  const id = crear.json?.id;
  check(
    'tarea con id, estado pendiente y creadaEn',
    Number.isInteger(id) && crear.json.estado === 'pendiente' && !!crear.json.creadaEn,
    JSON.stringify(crear.json),
  );

  // POST sin título -> 400
  const crearInvalido = await req('POST', '/tareas', { descripcion: 'sin titulo' });
  check('400 crear sin título', crearInvalido.status === 400, `status=${crearInvalido.status}`);

  // GET /tareas -> 200 con la nueva
  const listar = await req('GET', '/tareas');
  check('200 listar', listar.status === 200, `status=${listar.status}`);
  check(
    'listado contiene la tarea creada',
    Array.isArray(listar.json) && listar.json.some((t) => t.id === id),
    `total=${listar.json?.length}`,
  );

  // GET /tareas/:id -> 200
  const obtener = await req('GET', `/tareas/${id}`);
  check('200 obtener por id', obtener.status === 200 && obtener.json.id === id, `status=${obtener.status}`);

  // GET inexistente -> 404
  const inexistente = await req('GET', '/tareas/999999');
  check('404 obtener inexistente', inexistente.status === 404, `status=${inexistente.status}`);

  // PUT -> 200 y persistencia verificada
  const actualizar = await req('PUT', `/tareas/${id}`, {
    titulo: 'Tarea smoke actualizada',
    estado: 'completada',
  });
  check('200 actualizar', actualizar.status === 200, `status=${actualizar.status}`);
  const obtener2 = await req('GET', `/tareas/${id}`);
  check(
    'actualización persistida',
    obtener2.json.titulo === 'Tarea smoke actualizada' && obtener2.json.estado === 'completada',
    JSON.stringify(obtener2.json),
  );

  // PUT inexistente -> 404
  const actualizarInexistente = await req('PUT', '/tareas/999999', { titulo: 'X' });
  check('404 actualizar inexistente', actualizarInexistente.status === 404, `status=${actualizarInexistente.status}`);

  // DELETE -> 204 y desaparece del listado
  const eliminar = await req('DELETE', `/tareas/${id}`);
  check('204 eliminar', eliminar.status === 204, `status=${eliminar.status}`);
  const obtener3 = await req('GET', `/tareas/${id}`);
  check('404 tras eliminar', obtener3.status === 404, `status=${obtener3.status}`);
  const listar2 = await req('GET', '/tareas');
  check(
    'listado sin la tarea eliminada',
    Array.isArray(listar2.json) && !listar2.json.some((t) => t.id === id),
    `total=${listar2.json?.length}`,
  );

  // DELETE inexistente -> 404
  const eliminarInexistente = await req('DELETE', '/tareas/999999');
  check('404 eliminar inexistente', eliminarInexistente.status === 404, `status=${eliminarInexistente.status}`);

  console.log(process.exitCode ? 'SMOKE: FALLÓ' : 'SMOKE: OK (14/14)');
})().catch((e) => {
  console.error('SMOKE ERROR:', e.message);
  process.exitCode = 1;
});
