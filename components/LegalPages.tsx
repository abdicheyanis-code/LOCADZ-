import React from 'react';
import { AppLanguage } from '../types';

interface LegalPagesProps {
  language: AppLanguage;
}

export const LegalPages: React.FC<LegalPagesProps> = ({ language }) => {
  // Pour l’instant, texte en français uniquement.
  return (
    <div className="mt-16 space-y-12">
      {/* Petit disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 text-[11px] text-amber-700 font-bold uppercase tracking-widest">
        Ce contenu est un modèle informatif et ne remplace pas un avis juridique professionnel.
      </div>

      {/* Mentions légales */}
      <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10">
        <h2 className="text-2xl md:text-3xl font-black italic text-white mb-4">
          Mentions légales
        </h2>
        <div className="space-y-3 text-sm text-white/80 leading-relaxed">
          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              Éditeur du site
            </span>
            <br />
            LOCADZ – plateforme de mise en relation voyageurs / hôtes en Algérie.
            <br />
            Statut : projet en cours de création (structure juridique en cours de définition).
            <br />
            Responsable de la publication : équipe fondatrice LOCA DZ.
            <br />
            Email de contact :{' '}
            <a
              href="mailto:loca.dz@hotmail.com"
              className="underline text-indigo-300 hover:text-indigo-200"
            >
              loca.dz@hotmail.com
            </a>
            .
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              Hébergement
            </span>
            <br />
            Frontend hébergé par : Vercel Inc. – vercel.com
            <br />
            Backend / Base de données : Supabase – supabase.com
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              Propriété intellectuelle
            </span>
            <br />
            L’ensemble des éléments graphiques, textes, logos, et contenus présents sur
            la plateforme LOCADZ sont protégés par les lois en vigueur et ne peuvent
            être reproduits sans autorisation écrite préalable.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              Contact
            </span>
            <br />
            Pour toute question légale ou signalement de contenu, vous pouvez écrire à :
            <br />
            &gt; Email :{' '}
            <a
              href="mailto:loca.dz@hotmail.com"
              className="underline text-indigo-300 hover:text-indigo-200"
            >
              loca.dz@hotmail.com
            </a>
          </p>
        </div>
      </section>

      {/* Conditions générales d’utilisation */}
      <section className="bg-white rounded-[2.5rem] p-8 md:p-10 text-indigo-950">
        <h2 className="text-2xl md:text-3xl font-black italic mb-4">
          Conditions Générales d’Utilisation (CGU)
        </h2>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            Les présentes Conditions Générales d’Utilisation (CGU) ont pour objet de
            définir les modalités d’accès et d’utilisation de la plateforme LOCADZ par
            les voyageurs et les hôtes.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              1. Rôle de LOCADZ
            </span>
            <br />
            LOCADZ est une plateforme de mise en relation. La plateforme permet aux
            hôtes de publier des annonces de logements, et aux voyageurs d’effectuer
            des demandes de réservation. LOCADZ n’est pas partie aux contrats conclus
            directement entre hôtes et voyageurs.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              2. Comptes utilisateurs
            </span>
            <br />
            Pour utiliser la plateforme, chaque utilisateur doit créer un compte en
            fournissant des informations exactes et à jour. LOCADZ se réserve le droit
            de suspendre ou supprimer tout compte en cas de fraude, d’abus ou de non
            respect des présentes CGU.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              3. Réservations et paiements
            </span>
            <br />
            Le prix affiché comprend le tarif de base fixé par l’hôte ainsi que, le
            cas échéant, les frais de service LOCADZ. Les modalités de paiement
            (sur place, virement, etc.) sont indiquées lors de la réservation.
            <br />
            LOCADZ peut, selon le modèle choisi, encaisser les paiements pour le
            compte des hôtes et reverser ensuite les montants dus (payouts). Les
            hôtes restent responsables de leurs obligations fiscales et déclaratives.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              4. Responsabilité des hôtes et des voyageurs
            </span>
            <br />
            L’hôte est seul responsable :
            <br />- de la conformité du logement à la description,
            <br />- de la sécurité et de la propreté du lieu,
            <br />- du respect des lois locales (urbanisme, fiscalité, etc.).
            <br />
            Le voyageur est responsable :
            <br />- du respect des lieux occupés,
            <br />- du bon déroulement son séjour,
            <br />- et de la communication sincère avec l’hôte.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              5. Annulations et litiges
            </span>
            <br />
            Les conditions d’annulation (délai, frais, remboursement) sont définies
            par l’hôte ou par la politique LOCADZ en vigueur. En cas de litige entre
            un hôte et un voyageur, LOCADZ pourra intervenir en médiation, sans
            garantir un résultat ni se substituer aux parties.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              6. Suspension / suppression de compte
            </span>
            <br />
            LOCADZ se réserve le droit de suspendre ou résilier l’accès à la plateforme
            de tout utilisateur en cas de :
            <br />- non‑respect des présentes CGU,
            <br />- comportement frauduleux ou abusif,
            <br />- non respect des lois applicables.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              7. Modification des CGU
            </span>
            <br />
            LOCADZ peut mettre à jour les présentes CGU à tout moment. En cas de
            modification importante, les utilisateurs en seront informés via la
            plateforme. L’utilisation continue du service vaut acceptation des
            nouvelles conditions.
          </p>
        </div>
      </section>

      {/* Politique de confidentialité */}
      <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10">
        <h2 className="text-2xl md:text-3xl font-black italic text-white mb-4">
          Politique de confidentialité
        </h2>
        <div className="space-y-3 text-sm text-white/80 leading-relaxed">
          <p>
            LOCADZ attache une grande importance à la protection des données
            personnelles de ses utilisateurs. Cette politique explique quelles
            données sont collectées, comment elles sont utilisées et quels sont vos
            droits.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              1. Données collectées
            </span>
            <br />
            Lors de l’inscription et de l’utilisation de la plateforme, LOCADZ peut
            collecter :
            <br />- Nom, prénom, adresse email, numéro de téléphone,
            <br />- Informations de profil (rôle : voyageur / hôte),
            <br />- Informations liées aux réservations (dates, propriétés, montants),
            <br />- Coordonnées de paiement hôte (CCP / RIB) pour les virements,
            <br />- Preuves de paiement (URL de documents ou captures, sans stocker les
            identifiants bancaires complets).
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text:white/60">
              2. Finalités
            </span>
            <br />
            Ces données sont utilisées pour :
            <br />- Permettre la création et la gestion de votre compte,
            <br />- Assurer le bon déroulement des réservations et échanges entre
            hôtes et voyageurs,
            <br />- Gérer la facturation et les éventuels reversements aux hôtes,
            <br />- Sécuriser la plateforme et prévenir les usages abusifs,
            <br />- Améliorer l’expérience utilisateur (statistiques anonymisées).
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              3. Hébergement et stockage
            </span>
            <br />
            Les données sont hébergées chez des prestataires tiers :
            <br />- Supabase (base de données et authentification),
            <br />- Vercel (hébergement frontend).
            <br />
            Ces prestataires peuvent être situés en dehors de votre pays de
            résidence. LOCADZ s’efforce d’utiliser des services conformes aux
            standards de sécurité en vigueur.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              4. Partage des données
            </span>
            <br />
            Les données personnelles ne sont jamais revendues. Elles peuvent être
            partagées :
            <br />- avec les hôtes / voyageurs concernés par une réservation,
            <br />- avec des prestataires techniques (hébergement, paiement, email),
            <br />- avec les autorités compétentes en cas d’obligation légale.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              5. Droits des utilisateurs
            </span>
            <br />
            Vous disposez d’un droit d’accès, de rectification, de suppression et
            d’opposition concernant vos données personnelles. Pour exercer ces
            droits, vous pouvez écrire à l’email de contact indiqué dans les
            mentions légales.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              6. Durée de conservation
            </span>
            <br />
            Les données sont conservées pendant la durée nécessaire à la fourniture
            du service et au respect des obligations légales. Certaines informations
            peuvent être conservées plus longtemps à des fins comptables ou de
            preuve en cas de litige.
          </p>
        </div>
      </section>
    </div>
  );
};
