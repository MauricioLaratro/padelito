import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");

/**
 * Lee variables locales sin depender de paquetes extra.
 * Se construye para reutilizar `.env.local` en QA local.
 * Lo usa este script de smoke test.
 * Sirve para no versionar credenciales ni duplicar configuracion.
 */
function readLocalEnvironment() {
  const environmentPath = resolve(projectDirectory, ".env.local");

  try {
    return readFileSync(environmentPath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .reduce((environmentValues, environmentLine) => {
        const [rawKey, ...rawValueParts] = environmentLine.split("=");
        const key = rawKey?.trim();

        if (!key || key.startsWith("#")) {
          return environmentValues;
        }

        return {
          ...environmentValues,
          [key]: rawValueParts.join("=").trim(),
        };
      }, {});
  } catch {
    return {};
  }
}

/**
 * Registra una asercion legible.
 * Se construye para producir un reporte simple en consola.
 * Lo usan todas las verificaciones del script.
 * Sirve para fallar rapido sin framework de test adicional.
 */
function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Ejecuta una consulta Supabase y normaliza errores.
 * Se construye para mantener el reporte de QA consistente.
 * Lo usa cada lectura de RLS.
 * Sirve para detectar permisos rotos con mensajes claros.
 */
async function readRows(label, query) {
  const { data, error } = await query;

  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Crea cliente Supabase aislado.
 * Se construye para simular sesiones separadas.
 * Lo usa el smoke test principal.
 * Sirve para validar RLS con usuarios autenticados reales.
 */
function createQaClient(supabaseUrl, supabaseKey) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

/**
 * Valida que el telefono no sea legible por REST.
 * Se construye para proteger `whatsapp_phone`.
 * Lo usan cliente anonimo y autenticado.
 * Sirve para confirmar seguridad de columna.
 */
async function assertWhatsappIsPrivate(client, label) {
  const { error } = await client
    .from("profiles")
    .select("id, whatsapp_phone")
    .limit(1);

  assertCondition(
    Boolean(error),
    `${label}: whatsapp_phone deberia estar bloqueado por permisos de columna`,
  );
}

/**
 * Valida que el reset de score no sea editable por REST.
 * Se construye para que el usuario solo pueda ejecutar la accion controlada.
 * Lo usa la sesion autenticada de QA.
 * Sirve para proteger estadisticas sin mutar datos.
 */
async function assertMatchStatsResetIsNotDirectlyEditable(
  client,
  currentUserId,
) {
  const { error } = await client
    .from("profiles")
    .update({ match_stats_reset_at: "2000-01-01T00:00:00.000Z" })
    .eq("id", currentUserId);

  assertCondition(
    Boolean(error),
    "match_stats_reset_at no deberia poder editarse directamente por REST",
  );
}

/**
 * Ejecuta verificaciones autenticadas de RLS.
 * Se construye para cubrir tablas sensibles sin crear datos.
 * Lo usa la sesion primaria de QA.
 * Sirve para auditar privacidad antes de produccion.
 */
async function runAuthenticatedPrivacyChecks(client, currentUserId) {
  const notifications = await readRows(
    "leer notificaciones propias",
    client
      .from("notifications")
      .select("id, recipient_profile_id")
      .limit(50),
  );
  assertCondition(
    notifications.every(
      (notification) => notification.recipient_profile_id === currentUserId,
    ),
    "RLS de notifications expuso notificaciones de otro usuario",
  );

  const joinRequests = await readRows(
    "leer solicitudes visibles",
    client
      .from("match_join_requests")
      .select("id, requester_profile_id, owner_profile_id")
      .limit(50),
  );
  assertCondition(
    joinRequests.every(
      (request) =>
        request.requester_profile_id === currentUserId ||
        request.owner_profile_id === currentUserId,
    ),
    "RLS de match_join_requests expuso solicitudes ajenas",
  );

  const invitations = await readRows(
    "leer invitaciones visibles",
    client
      .from("direct_match_invitations")
      .select("id, inviter_profile_id, invited_profile_id")
      .limit(50),
  );
  assertCondition(
    invitations.every(
      (invitation) =>
        invitation.inviter_profile_id === currentUserId ||
        invitation.invited_profile_id === currentUserId,
    ),
    "RLS de direct_match_invitations expuso invitaciones ajenas",
  );

  const matchRecords = await readRows(
    "leer partidos visibles",
    client.from("match_records").select("id, owner_profile_id").limit(50),
  );
  const matchParticipants = await readRows(
    "leer participantes visibles",
    client.from("match_participants").select("match_id, profile_id").limit(100),
  );
  const currentUserMatchIds = new Set(
    matchParticipants
      .filter((participant) => participant.profile_id === currentUserId)
      .map((participant) => participant.match_id),
  );
  assertCondition(
    matchRecords.every(
      (matchRecord) =>
        matchRecord.owner_profile_id === currentUserId ||
        currentUserMatchIds.has(matchRecord.id),
    ),
    "RLS de match_records expuso partidos sin relacion con el usuario",
  );

  const recurringChallenges = await readRows(
    "leer desafios visibles",
    client.from("recurring_challenges").select("id, owner_profile_id").limit(50),
  );
  const recurringChallengeParticipants = await readRows(
    "leer participantes de desafios visibles",
    client
      .from("recurring_challenge_participants")
      .select("challenge_id, profile_id")
      .limit(100),
  );
  const currentUserChallengeIds = new Set(
    recurringChallengeParticipants
      .filter((participant) => participant.profile_id === currentUserId)
      .map((participant) => participant.challenge_id),
  );
  assertCondition(
    recurringChallenges.every(
      (challenge) =>
        challenge.owner_profile_id === currentUserId ||
        currentUserChallengeIds.has(challenge.id),
    ),
    "RLS de recurring_challenges expuso desafios sin relacion con el usuario",
  );

  const privateContact = await client.rpc("get_profile_private_contact", {
    target_profile_id_input: currentUserId,
  });
  assertCondition(
    !privateContact.error,
    `RPC get_profile_private_contact fallo para perfil propio: ${
      privateContact.error?.message ?? ""
    }`,
  );

  return {
    invitations: invitations.length,
    joinRequests: joinRequests.length,
    matchRecords: matchRecords.length,
    notifications: notifications.length,
    recurringChallenges: recurringChallenges.length,
  };
}

/**
 * Ejecuta smoke test de Supabase.
 * Se construye para validar auth, RLS y privacidad sin mutar datos.
 * Lo usa `npm run qa:supabase`.
 * Sirve como preflight antes de auditoria manual.
 */
async function main() {
  const localEnvironment = readLocalEnvironment();
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ?? localEnvironment.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ??
    localEnvironment.VITE_SUPABASE_ANON_KEY;
  const qaEmail = process.env.PADELITO_QA_EMAIL;
  const qaPassword = process.env.PADELITO_QA_PASSWORD;
  const secondQaEmail = process.env.PADELITO_QA_SECOND_EMAIL;
  const secondQaPassword = process.env.PADELITO_QA_SECOND_PASSWORD;

  assertCondition(Boolean(supabaseUrl), "Falta VITE_SUPABASE_URL");
  assertCondition(Boolean(supabaseKey), "Falta VITE_SUPABASE_ANON_KEY");
  assertCondition(Boolean(qaEmail), "Falta PADELITO_QA_EMAIL");
  assertCondition(Boolean(qaPassword), "Falta PADELITO_QA_PASSWORD");

  const anonymousClient = createQaClient(supabaseUrl, supabaseKey);
  await assertWhatsappIsPrivate(anonymousClient, "anon");

  const primaryClient = createQaClient(supabaseUrl, supabaseKey);
  const primarySession = await primaryClient.auth.signInWithPassword({
    email: qaEmail,
    password: qaPassword,
  });

  if (primarySession.error) {
    throw new Error(`login QA primario: ${primarySession.error.message}`);
  }

  const currentUserId = primarySession.data.user.id;
  await assertWhatsappIsPrivate(primaryClient, "authenticated");
  await assertMatchStatsResetIsNotDirectlyEditable(
    primaryClient,
    currentUserId,
  );

  const publicProfiles = await readRows(
    "leer perfiles publicos",
    primaryClient
      .from("profiles")
      .select(
        "id, profile_type, display_name, avatar_url, bio, usual_place, match_stats_reset_at, player_level, preferred_position, preferred_play_style, organization_kind, organization_link, created_at, updated_at",
      )
      .limit(50),
  );
  assertCondition(
    publicProfiles.every((profile) => !("whatsapp_phone" in profile)),
    "La lectura publica de profiles incluyo whatsapp_phone",
  );

  const privacySummary = await runAuthenticatedPrivacyChecks(
    primaryClient,
    currentUserId,
  );

  let secondSessionSummary = "no configurada";

  if (secondQaEmail && secondQaPassword) {
    const secondClient = createQaClient(supabaseUrl, supabaseKey);
    const secondSession = await secondClient.auth.signInWithPassword({
      email: secondQaEmail,
      password: secondQaPassword,
    });

    if (secondSession.error) {
      throw new Error(`login QA secundario: ${secondSession.error.message}`);
    }

    assertCondition(
      secondSession.data.user.id !== currentUserId,
      "La segunda sesion debe pertenecer a otro usuario",
    );
    await assertWhatsappIsPrivate(secondClient, "second authenticated");
    secondSessionSummary = "validada sin mutar datos";
  }

  await primaryClient.auth.signOut();

  console.log(
    JSON.stringify(
      {
        checks: {
          authenticatedPrivacy: privacySummary,
          matchStatsResetDirectUpdateBlocked: true,
          publicProfiles: publicProfiles.length,
          secondSession: secondSessionSummary,
          whatsappColumnBlocked: true,
        },
        status: "ok",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
