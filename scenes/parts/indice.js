/* ==========================================================================
   GRIP — indice del kit: dal nome di una forma al pezzo 3D.
   Usato da vetrina, montaggio, miniature del catalogo e snapshot.
   ========================================================================== */
import { esterna } from './esterna.js';
import * as aria from './aria.js';
import * as bagno from './bagno.js';

export const KIT = {
  'esterna': (o) => esterna(o),
  'split': aria.split,
  'console': aria.consolle,
  'cassetta': aria.cassetta,
  'pavimento': aria.pavimento,
  'canalizzato': aria.canalizzato,
  'colonna': aria.colonna,
  'vrf': aria.vrf,
  'accumulo': aria.accumulo,
  'boiler': aria.boiler,
  'duo': aria.duo,
  'gas': aria.gas,
  'ventola-terra': aria.ventolaTerra,
  'ventola-parete': aria.ventolaParete,
  'deumidificatore': aria.deumidificatore,
  'portatile': aria.portatile,
  /* Ercos */
  'radiatore': bagno.radiatore,
  'scaldasalviette': bagno.scaldasalviette,
  'miscelatore': bagno.miscelatore,
  'doccia': bagno.setDoccia
};

/** Crea il pezzo di una forma. Le opzioni passano al costruttore (es. dettaglio). */
export function crea(forma, opzioni = {}) {
  const f = KIT[forma];
  if (!f) throw new Error('Forma senza pezzo 3D: ' + forma);
  return f(opzioni);
}
