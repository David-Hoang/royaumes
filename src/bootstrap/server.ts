import { createBetterAuth } from '@/platform/auth/better-auth'
import type { AuthPort, AuthUser } from '@/platform/auth/port'
import { createDatabase } from '@/platform/db/client'
import { createEventStore } from '@/platform/event-store/event-store'
import { type Api, createApi } from './create-api'

/** Ce que l'application expose à Next.js. */
interface Server {
  api: Api
  /** Authentification, utilisée aussi par les pages rendues sur le serveur. */
  auth: AuthPort
  /** Résolue lorsque la base de données est prête. */
  ready: Promise<void>
}

/**
 * L'instance est conservée dans l'objet global du processus.
 * En développement, Next.js recharge les modules à chaque modification :
 * une simple variable de module serait alors réinitialisée, et l'application
 * reconstruite à chaque fois, avec une nouvelle connexion à la base.
 */
const globalForServer = globalThis as unknown as { royaumes?: Server }

/**
 * Renvoie l'application, en la construisant à la première demande.
 * Cette construction paresseuse garantit qu'aucun code de l'application,
 * et en particulier aucune connexion à la base, ne s'exécute lorsque Next.js
 * analyse les fichiers pendant la construction.
 */
export function getServer(): Server {
  if (!globalForServer.royaumes) {
    // La plateforme : la base de données, puis les briques qui l'utilisent.
    const { db, ready } = createDatabase()
    const store = createEventStore(db)
    const auth = createBetterAuth(db)
    // Durée maximale d'un flux temps réel : 240 s par défaut, sous la limite de 300 s de Vercel.
    // La variable STREAM_MAX_SECONDS permet de la raccourcir pour observer la reconnexion.
    const maxStreamMs = Number(process.env.STREAM_MAX_SECONDS ?? 240) * 1000
    // Service Village extrait (TD11) : utilisé seulement si son adresse et le secret partagé
    // sont définis. Sur Vercel, ils ne le sont pas : le Village s'exécute dans le processus.
    const url = process.env.REALM_SERVICE_URL
    const secret = process.env.SERVICE_SECRET
    const realmService = url && secret ? { url, secret } : undefined
    globalForServer.royaumes = {
      api: createApi({
        auth,
        db,
        store,
        ready,
        realtime: { maxStreamMs },
        cronSecret: process.env.CRON_SECRET,
        realmService,
      }),
      auth,
      ready,
    }
  }
  return globalForServer.royaumes
}

/**
 * Joueur connecté, pour les pages rendues sur le serveur.
 * Les pages n'appellent pas l'API : elles interrogent directement le port d'authentification,
 * à partir des en-têtes de la requête reçue par Next.js.
 */
export async function currentUser(headers: Headers): Promise<AuthUser | null> {
  const { auth, ready } = getServer()
  await ready
  return auth.getUser(headers)
}

/**
 * Indique si le joueur connecté a déjà fondé son village. La page interroge l'API du Village
 * comme le ferait le navigateur, avec les en-têtes (et donc la session) de la requête reçue.
 */
export async function hasVillage(headers: Headers): Promise<boolean> {
  const { api, ready } = getServer()
  await ready
  const res = await api.fetch(
    new Request('http://localhost/api/realm/village', {
      headers: { cookie: headers.get('cookie') ?? '' },
    }),
  )
  if (!res.ok) return true
  const body = (await res.json()) as { view: unknown }
  return body.view !== null
}
