import React from 'react';
import { AppLanguage } from '../types';

interface LegalPagesProps {
  language: AppLanguage;
}

export const LegalPages: React.FC<LegalPagesProps> = ({ language }) => {
  // Pour l’instant, texte en français uniquement.
  // À faire valider / adapter par un avocat en Algérie avant mise en production.
  return (
    <div className="mt-16 space-y-12">
      {/* DISCLAIMER JURIDIQUE */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 text-[11px] text-amber-700 font-bold uppercase tracking-widest">
        Ce contenu est un modèle informatif fourni à titre indicatif uniquement.
        Il ne remplace en aucun cas un avis juridique professionnel. Ces textes
        doivent être relus et validés par un avocat inscrit en Algérie avant
        toute utilisation officielle.
      </div>

      {/* MENTIONS LÉGALES */}
      <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10">
        <h2 className="text-2xl md:text-3xl font-black italic text-white mb-4">
          Mentions légales
        </h2>
        <div className="space-y-4 text-sm text-white/80 leading-relaxed">
          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              Éditeur du site
            </span>
            <br />
            <span className="font-semibold">LOCA DZ</span> – plateforme de mise
            en relation entre hôtes et voyageurs pour la location de logements
            en Algérie.
            <br />
            Statut actuel : projet en cours de création (structure juridique en
            cours de formalisation).
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
            Backend / Base de données / Authentification : Supabase – supabase.com
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              Propriété intellectuelle
            </span>
            <br />
            L’ensemble des éléments graphiques, interfaces, logos, textes,
            vidéos et contenus présents sur la plateforme LOCA DZ sont protégés
            par les lois applicables en matière de propriété intellectuelle.
            Toute reproduction, représentation, modification ou exploitation non
            autorisée est interdite.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              Contact
            </span>
            <br />
            Pour toute question juridique, demande de retrait de contenu ou
            signalement :
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

      {/* CONDITIONS GÉNÉRALES D’UTILISATION */}
      <section className="bg-white rounded-[2.5rem] p-8 md:p-10 text-indigo-950">
        <h2 className="text-2xl md:text-3xl font-black italic mb-4">
          Conditions Générales d’Utilisation (CGU)
        </h2>
        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            Les présentes Conditions Générales d’Utilisation (CGU) ont pour
            objet de définir les règles d’accès et d’utilisation de la
            plateforme LOCA DZ par les hôtes et les voyageurs. En utilisant la
            plateforme, l’utilisateur reconnaît avoir lu, compris et accepté les
            présentes CGU.
          </p>

          {/* 1. Définitions et rôle de LOCA DZ */}
          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              1. Définitions et rôle de LOCA DZ
            </span>
            <br />
            « Plateforme » : le site et/ou l’application LOCA DZ.
            <br />
            « Hôte » : toute personne utilisant la plateforme pour proposer un
            logement en location.
            <br />
            « Voyageur » : toute personne utilisant la plateforme pour
            rechercher et réserver un logement.
            <br />
            LOCA DZ agit en qualité de <span className="font-semibold">
              plateforme de mise en relation
            </span>
            . La plateforme permet aux hôtes de publier des annonces et aux
            voyageurs d’envoyer des demandes de réservation. LOCA DZ n’est pas
            partie au contrat de location conclu entre l’hôte et le voyageur et
            n’est pas une agence immobilière ni un intermédiaire agréé au sens
            des réglementations professionnelles.
          </p>

          {/* 2. Accès à la plateforme et comptes */}
          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              2. Accès à la plateforme et création de compte
            </span>
            <br />
            L’accès à la plateforme nécessite une connexion internet et un
            appareil compatible. LOCA DZ ne garantit pas la disponibilité
            continue et exempte d’erreurs du service.
            <br />
            Pour publier une annonce ou effectuer une réservation, l’utilisateur
            doit créer un compte en fournissant des informations exactes,
            sincères et à jour (nom, email, téléphone, etc.). Il est
            responsable de la confidentialité de ses identifiants et de toute
            activité réalisée via son compte.
          </p>

          {/* 3. Conditions d’inscription (âge, vérification) */}
          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              3. Conditions d’inscription
            </span>
            <br />
            L’utilisation de la plateforme est réservée aux personnes majeures
            disposant de leur pleine capacité juridique (généralement 18 ans et
            plus).
            <br />
            LOCA DZ peut mettre en place des procédures de vérification
            d’identité (upload de pièce d’identité, vérification manuelle,
            statut « hôte vérifié »). Ces vérifications restent limitées et ne
            dispensent pas les utilisateurs de leur propre vigilance.
          </p>

          {/* 4. Publication des annonces par les hôtes */}
          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              4. Annonces et obligations des hôtes
            </span>
            <br />
            L’hôte s’engage à :
            <br />- publier une description fidèle et complète du logement
            (localisation, équipements, règles, prix, photos),
            <br />- garantir que le logement proposé est conforme aux lois
            algériennes applicables (urbanisme, sécurité, hygiène, etc.),
            <br />- obtenir toutes les autorisations nécessaires (propriétaire,
            syndic, autorisations administratives le cas échéant),
            <br />- respecter ses obligations fiscales (déclaration des revenus,
            taxes, etc.),
            <br />- assurer un accueil et un séjour conformes aux informations
            fournies.
            <br />
            L’hôte reste seul responsable du logement, de la sécurité des
            occupants et du respect de la réglementation locale.
          </p>

          {/* 5. Réservation et fonctionnement */}
          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              5. Fonctionnement des réservations
            </span>
            <br />
            Le voyageur peut envoyer une demande de réservation pour un logement
            disponible aux dates sélectionnées. L’hôte reçoit une notification
            et peut accepter ou refuser la demande dans le délai indiqué sur la
            plateforme.
            <br />
            Tant que la demande est en attente de validation (« en cours »),
            aucune réservation ferme n’est garantie. La réservation n’est
            considérée comme confirmée qu’après acceptation par l’hôte (et, le
            cas échéant, après paiement selon le modèle choisi).
          </p>

          {/* 6. Paiements et commissions */}
          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              6. Paiements, frais de service et commissions
            </span>
            <br />
            Selon le fonctionnement paramétré par LOCA DZ, les paiements peuvent
            être réalisés :
            <br />- directement entre voyageur et LOCA DZ (paiement centralisé),
            ou
            <br />- via des canaux locaux (BaridiMob, CCP, RIB, etc.) avec
            preuve de paiement.
            <br />
            Des <span className="font-semibold">frais de service</span> peuvent
            être appliqués côté voyageur, ainsi qu’une{' '}
            <span className="font-semibold">commission côté hôte</span>, selon
            les taux affichés sur la plateforme (par exemple 5 % / 5 %). Ces
            frais rémunèrent les services de mise en relation, de support et
            d’outillage numérique fournis par LOCA DZ.
            <br />
            L’hôte reste responsable de la déclaration des revenus perçus via la
            plateforme auprès des autorités fiscales compétentes.
          </p>

          {/* 7. Annulation, no‑show, litiges */}
          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              7. Annulation, non‑présentation et litiges
            </span>
            <br />
            Les conditions d’annulation (délais, éventuels frais, remboursement)
            sont précisées dans l’interface de réservation ou dans la politique
            LOCA DZ en vigueur. En l’absence de conditions spécifiques, une
            annulation tardive ou une non‑présentation (« no‑show ») peut
            entraîner la perte totale ou partielle des sommes versées, selon ce
            qui a été convenu entre l’hôte et le voyageur.
            <br />
            En cas de litige, LOCA DZ peut proposer une médiation amiable mais
            ne garantit pas une solution ni un remboursement automatique. En
            dernier recours, le litige relève des juridictions compétentes
            algériennes.
          </p>

          {/* 8. Comportements interdits */}
          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              8. Comportements interdits
            </span>
            <br />
            Sont notamment interdits :
            <br />- l’utilisation de la plateforme pour des activités illégales
            (trafic, proxénétisme, fraude, etc.),
            <br />- la sous‑location non autorisée,
            <br />- la publication de contenus diffamatoires, violents, haineux
            ou discriminatoires,
            <br />- toute tentative de piratage, copie massive de données ou
            atteinte au bon fonctionnement de LOCA DZ.
            <br />
            LOCA DZ se réserve le droit de suspendre ou supprimer tout compte
            en cas de comportement contraire aux présentes CGU ou à la loi.
          </p>

          {/* 9. Responsabilité de LOCA DZ */}
          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              9. Limitation de responsabilité
            </span>
            <br />
            LOCA DZ ne garantit pas la disponibilité permanente et exempte
            d’erreur de la plateforme. LOCA DZ ne peut être tenue responsable :
            <br />- de la qualité réelle des logements proposés,
            <br />- du comportement des hôtes ou des voyageurs,
            <br />- des annulations, retards, dommages matériels ou corporels
            survenant pendant le séjour,
            <br />- d’un usage frauduleux des moyens de paiement par un
            utilisateur.
            <br />
            Dans la limite autorisée par la loi algérienne, toute éventuelle
            responsabilité de LOCA DZ serait en tout état de cause limitée au
            montant des frais de service perçus sur la réservation concernée.
          </p>

          {/* 10. Modification des CGU */}
          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              10. Modification des CGU
            </span>
            <br />
            LOCA DZ pourra modifier les présentes CGU à tout moment pour tenir
            compte de l’évolution du service, de la réglementation ou des
            meilleures pratiques. En cas de modification importante, les
            utilisateurs seront informés par un message sur la plateforme. La
            poursuite de l’utilisation du service après modification vaut
            acceptation des nouvelles CGU.
          </p>

          {/* 11. Droit applicable */}
          <p>
            <span className="font-black uppercase text-[11px] text-indigo-400">
              11. Droit applicable et juridiction compétente
            </span>
            <br />
            Les présentes CGU sont soumises au <span className="font-semibold">
              droit algérien
            </span>
            . Tout litige relatif à leur interprétation, leur validité ou leur
            exécution sera soumis aux tribunaux compétents du territoire
            algérien, sous réserve des règles de compétence territoriale
            applicables.
          </p>
        </div>
      </section>

      {/* POLITIQUE DE CONFIDENTIALITÉ */}
      <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10">
        <h2 className="text-2xl md:text-3xl font-black italic text-white mb-4">
          Politique de confidentialité
        </h2>
        <div className="space-y-4 text-sm text-white/80 leading-relaxed">
          <p>
            LOCA DZ attache une grande importance à la protection des données
            personnelles de ses utilisateurs. Cette politique décrit les
            principales règles de collecte et de traitement des données. Elle
            devra être complétée et adaptée avec l’aide d’un conseiller
            juridique qualifié.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              1. Données collectées
            </span>
            <br />
            LOCA DZ peut collecter notamment :
            <br />- Identité : nom, prénom, photo de profil, rôle (hôte /
            voyageur),
            <br />- Coordonnées : adresse email, numéro de téléphone,
            <br />- Données de compte : historique de connexions, préférences,
            langue,
            <br />- Données relatives aux réservations : logements consultés,
            dates, montants,
            <br />- Données de paiement hôte (CCP / RIB) pour permettre les
            virements,
            <br />- Copies de documents envoyés (pièce d’identité, preuve de
            paiement), sous forme de fichiers stockés sur un espace sécurisé.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              2. Finalités du traitement
            </span>
            <br />
            Les données sont traitées pour les finalités suivantes :
            <br />- création et gestion des comptes utilisateurs,
            <br />- mise en relation hôtes / voyageurs et gestion des
            réservations,
            <br />- traitement des paiements, virements et preuves de paiement,
            <br />- sécurisation de la plateforme et lutte contre la fraude,
            <br />- amélioration du service (statistiques anonymisées),
            <br />- communication avec les utilisateurs (emails de service,
            notifications).
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              3. Base légale (à adapter)
            </span>
            <br />
            Selon les cas, les traitements de données peuvent reposer sur :
            <br />- l’exécution du contrat (gestion des comptes, réservations),
            <br />- le consentement (inscription à certaines communications),
            <br />- l’intérêt légitime de LOCA DZ (sécurité, prévention de la
            fraude),
            <br />- le respect d’obligations légales ou réglementaires.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              4. Destinataires et sous‑traitants
            </span>
            <br />
            Les données peuvent être accessibles :
            <br />- aux équipes LOCA DZ strictement habilitées,
            <br />- aux hôtes / voyageurs concernés par une réservation (données
            nécessaires à l’exécution du séjour),
            <br />- à des prestataires techniques (hébergement, stockage,
            email),
            <br />- aux autorités administratives ou judiciaires en cas
            d’obligation légale.
            <br />
            Les prestataires utilisés (notamment Supabase, Vercel, services
            d’emailing) s’engagent contractuellement sur des mesures de sécurité
            appropriées.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              5. Conservation des données
            </span>
            <br />
            Les données sont conservées pendant la durée nécessaire à la
            fourniture du service, augmentée des délais de prescription légale
            éventuellement applicables (gestion des preuves, comptabilité,
            litiges). Au‑delà, elles peuvent être anonymisées ou supprimées.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              6. Droits des utilisateurs
            </span>
            <br />
            Sous réserve du droit applicable, chaque utilisateur peut demander :
            <br />- l’accès à ses données,
            <br />- la rectification ou la mise à jour,
            <br />- la suppression (dans la limite des obligations légales),
            <br />- la limitation de certains traitements,
            <br />- l’opposition à certains usages (prospection, etc.).
            <br />
            Pour exercer ces droits, il est possible de contacter LOCA DZ à
            l’adresse suivante :{' '}
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
              7. Sécurité
            </span>
            <br />
            LOCA DZ met en œuvre des mesures de sécurité techniques et
            organisationnelles raisonnables (authentification, contrôle d’accès,
            sauvegardes, etc.). Aucun système n’étant totalement infaillible,
            l’utilisateur est invité à utiliser des mots de passe forts et à ne
            pas les partager.
          </p>

          <p>
            <span className="font-black uppercase text-[11px] text-white/60">
              8. Mise à jour de la politique
            </span>
            <br />
            La présente politique de confidentialité pourra être mise à jour
            pour tenir compte de l’évolution du service ou de la réglementation.
            En cas de modification importante, un avis sera affiché sur la
            plateforme.
          </p>
        </div>
      </section>
    </div>
  );
};
