#!/usr/bin/env bash
# Captura salidas REALES del backend en web/src/data/evidencia/.
# Uso (desde backend/): bash scripts/capturar-evidencia.sh
# Requisito: el backend ya está corriendo en el perfil dev en http://localhost:8080,
# arrancado con:  ./mvnw spring-boot:run -Dspring-boot.run.arguments=--debug 2>&1 | tee ../web/src/data/evidencia/arranque-completo.log
BASE="${BASE:-http://localhost:8080}"
EV="../web/src/data/evidencia"
PACIENTE="${PACIENTE:-1}"; MEDICO="${MEDICO:-1}"
mkdir -p "$EV"

req(){ # nombre, método, ruta, [cuerpo]
  local n="$1" m="$2" r="$3" b="$4"
  {
    echo "\$ curl -i -X $m $BASE$r${b:+ -H 'Content-Type: application/json' -d '$b'}"
    echo
    if [ -n "$b" ]; then curl -sS -i -X "$m" "$BASE$r" -H 'Content-Type: application/json' -d "$b"
    else curl -sS -i -X "$m" "$BASE$r"; fi
    echo
  } > "$EV/$n.txt" 2>&1
  echo "capturado: $n"
}
fecha(){ date -d "$1" +%Y-%m-%dT%H:%M:%S 2>/dev/null || { echo "ERROR: 'date -d' no disponible; usa Git Bash o ajusta las fechas" >&2; exit 1; }; }

OK=$(fecha "next monday 09:30"); PASADO="2020-01-05T09:00:00"; DOMINGO=$(fecha "next sunday 10:00")
cuerpo(){ echo "{\"pacienteId\":$1,\"medicoId\":$2,\"fechaHora\":\"$3\",\"motivo\":\"Control\"}"; }

curl -sS -o /dev/null -w "" "$BASE/actuator/health" || { echo "El backend no responde en $BASE"; exit 1; }

req http-201            POST /api/v1/citas "$(cuerpo $PACIENTE $MEDICO "$OK")"
req http-409            POST /api/v1/citas "$(cuerpo $PACIENTE $MEDICO "$OK")"
req http-400            POST /api/v1/citas "$(cuerpo $PACIENTE $MEDICO "$PASADO")"
req http-404            POST /api/v1/citas "$(cuerpo $PACIENTE 999 "$OK")"
req http-422            POST /api/v1/citas "$(cuerpo $PACIENTE $MEDICO "$DOMINGO")"

# 200: consulta de la cita creada (id tomado de la cabecera Location del 201)
LOC=$(grep -i '^Location:' "$EV/http-201.txt" | tr -d '\r' | sed 's/^[Ll]ocation: *//')
ID="${LOC##*/}"; [ -z "$ID" ] && ID=1
req http-200-cita       GET  "/api/v1/citas/$ID"
req http-200-medicos    GET  "/api/v1/medicos"
ESP=$(sed -n 's/.*"especialidad":"\([^"]*\)".*/\1/p' "$EV/http-200-medicos.txt" | head -1)
[ -n "$ESP" ] && req http-200-medicos-filtro GET "/api/v1/medicos?especialidad=$ESP"

curl -sS "$BASE/actuator/health" > "$EV/actuator-health.json" && echo "capturado: actuator-health"

# del log de arranque (si existe)
LOG="$EV/arranque-completo.log"
if [ -f "$LOG" ]; then
  grep -E "^20[0-9]{2}-.*(Tomcat started|profile is active|No active profile|Started ReservaMedica|HikariPool|H2 console)" "$LOG" > "$EV/arranque.log"
  awk '/CONDITIONS EVALUATION REPORT/{f=1} f{print}' "$LOG" | head -300 > "$EV/condiciones.txt"
  grep -E "insert into|select " "$LOG" | head -40 > "$EV/sql.txt"
  grep -E "Mapped|mapped" "$LOG" | head -40 > "$EV/mappings.txt"
  echo "extraído del log: arranque, condiciones, sql, mappings"
else
  echo "AVISO: no existe $LOG; arranca el backend con tee para capturar el log"
fi

./mvnw -q dependency:tree 2>/dev/null | grep -E "starter|tomcat-embed|hibernate-core|HikariCP|jackson|h2|postgresql|validator" > "$EV/dependency-tree.txt" && echo "capturado: dependency-tree"
if [ -z "$SKIP_TESTS" ]; then ./mvnw test 2>&1 | tail -30 > "$EV/junit-resumen.txt" && echo "capturado: junit-resumen"; fi
echo "Revisa los archivos de $EV: cada uno debe tener el código HTTP esperado. No edites salidas a mano."
