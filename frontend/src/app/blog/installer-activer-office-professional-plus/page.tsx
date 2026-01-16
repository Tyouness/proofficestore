import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Installer et Activer Office Professional Plus : Guide Complet 2026',
  description: 'Tutoriel détaillé pour télécharger, installer et activer Office Professional Plus. ISO officiel, clé d\'activation, résolution des erreurs. Guide pas à pas avec captures.',
  openGraph: {
    title: 'Comment Installer et Activer Office Professional Plus',
    description: 'Guide complet d\'installation Office Pro Plus',
    url: 'https://www.allkeymasters.com/blog/installer-activer-office-professional-plus',
    type: 'article',
  },
};

export default function BlogInstallerOfficePage() {
  return (
    <article className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Accueil</Link>
          <span className="mx-2">→</span>
          <Link href="/blog" className="hover:text-blue-600">Blog</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-900">Installer Office Professional Plus</span>
        </nav>

        <header className="mb-12">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded-full">
              Tutoriels
            </span>
            <span className="ml-3 text-sm text-gray-500">14 janvier 2026 · 6 min</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Comment installer et activer Office Professional Plus
          </h1>
          <p className="text-xl text-gray-600">
            Guide complet pour télécharger, installer et activer votre licence Office Professional Plus. Procédure pas à pas valable pour Office 2019, 2021 et 2024.
          </p>
        </header>

        <div className="prose prose-lg max-w-none">
          <h2>Prérequis avant l'installation</h2>

          <h3>Configuration système minimale</h3>
          <p>Avant de commencer, vérifiez que votre PC respecte ces spécifications minimales :</p>
          <ul>
            <li><strong>Système d'exploitation</strong> : Windows 10 ou Windows 11 (64 bits recommandé)</li>
            <li><strong>Processeur</strong> : 1 GHz minimum, 2 cœurs recommandé</li>
            <li><strong>RAM</strong> : 4 Go minimum, 8 Go recommandé</li>
            <li><strong>Espace disque</strong> : 4 Go minimum disponible</li>
            <li><strong>Résolution</strong> : 1280 x 768 pixels minimum</li>
            <li><strong>Connexion internet</strong> : Requise pour l'activation et les mises à jour</li>
          </ul>

          <h3>Éléments nécessaires</h3>
          <p>Assurez-vous d'avoir en votre possession :</p>
          <ul>
            <li>Votre <strong>clé produit à 25 caractères</strong> (format XXXXX-XXXXX-XXXXX-XXXXX-XXXXX)</li>
            <li>Votre <strong>compte Microsoft</strong> (recommandé mais optionnel)</li>
            <li>Les <strong>droits administrateur</strong> sur votre PC</li>
          </ul>

          <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6 my-8">
            <p className="text-yellow-900 font-semibold mb-2">⚠️ Important</p>
            <p className="text-yellow-800">
              Désinstallez toute version antérieure d'Office (2010, 2013, 2016) avant d'installer Office Professional Plus. Deux versions ne peuvent pas coexister.
            </p>
          </div>

          <h2>Étape 1 : Télécharger Office Professional Plus</h2>

          <h3>Méthode officielle Microsoft (recommandée)</h3>
          <p>
            Pour télécharger l'ISO officiel Office Professional Plus, Microsoft propose l'<strong>Office Deployment Tool</strong> (ODT). C'est la méthode la plus sûre et la plus fiable.
          </p>

          <ol>
            <li>Rendez-vous sur <code>microsoft.com/download/details.aspx?id=49117</code></li>
            <li>Téléchargez <strong>officedeploymenttool.exe</strong> (~3 Mo)</li>
            <li>Lancez l'exécutable et extrayez les fichiers dans <code>C:\ODT</code></li>
            <li>Ouvrez le Bloc-notes en tant qu'administrateur</li>
            <li>Créez un fichier <code>configuration.xml</code> avec ce contenu :</li>
          </ol>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6">
{`<Configuration>
  <Add OfficeClientEdition="64" Channel="PerpetualVL2021">
    <Product ID="ProPlus2021Volume" PIDKEY="VOTRE-CLÉ-25-CARACTERES">
      <Language ID="fr-fr" />
      <ExcludeApp ID="Groove" />
      <ExcludeApp ID="OneDrive" />
    </Product>
  </Add>
  <Display Level="Full" AcceptEULA="TRUE" />
</Configuration>`}
          </pre>

          <p>Remplacez <code>PIDKEY</code> par votre clé produit, puis :</p>
          <ol>
            <li>Sauvegardez le fichier dans <code>C:\ODT\configuration.xml</code></li>
            <li>Ouvrez PowerShell en tant qu'administrateur</li>
            <li>Exécutez : <code>cd C:\ODT</code></li>
            <li>Lancez l'installation : <code>.\setup.exe /configure configuration.xml</code></li>
          </ol>

          <p>Le téléchargement démarre automatiquement (~2 Go). L'installation suit immédiatement. Durée totale : <strong>15-30 minutes</strong> selon votre connexion.</p>

          <h3>Méthode alternative : Votre espace client AllKeyMasters</h3>
          <p>Si vous avez acheté votre licence chez AllKeyMasters :</p>
          <ol>
            <li>Connectez-vous à votre <Link href="/account" className="text-blue-600 hover:underline">espace client</Link></li>
            <li>Accédez à "Mes licences"</li>
            <li>Cliquez sur <strong>"Télécharger l'installateur"</strong></li>
            <li>Récupérez le fichier <code>OfficeSetup.exe</code> (~3 Mo)</li>
            <li>Double-cliquez pour lancer l'installation guidée</li>
          </ol>

          <h2>Étape 2 : Installer Office Professional Plus</h2>

          <h3>Procédure d'installation standard</h3>
          <p>Si vous utilisez l'ODT, l'installation est automatique après la commande <code>setup.exe /configure</code>. Si vous utilisez <code>OfficeSetup.exe</code> :</p>

          <ol>
            <li><strong>Lancement</strong> : Double-cliquez sur <code>OfficeSetup.exe</code></li>
            <li><strong>UAC</strong> : Acceptez l'invite de contrôle de compte d'utilisateur</li>
            <li><strong>Téléchargement</strong> : L'installateur télécharge les fichiers (barre de progression)</li>
            <li><strong>Installation</strong> : Les applications s'installent automatiquement (5-10 min)</li>
            <li><strong>Finalisation</strong> : Message "Vous êtes prêt à commencer"</li>
          </ol>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 my-8">
            <p className="text-blue-900 font-semibold mb-2">💡 Astuce</p>
            <p className="text-blue-800">
              Pendant l'installation, ne fermez pas votre PC et maintenez la connexion internet active. L'interruption pourrait corrompre l'installation.
            </p>
          </div>

          <h3>Personnaliser l'installation</h3>
          <p>Pour choisir quelles applications installer, modifiez <code>configuration.xml</code> avant l'installation :</p>
          <ul>
            <li><code>&lt;ExcludeApp ID="Groove" /&gt;</code> : Exclut OneDrive Entreprise</li>
            <li><code>&lt;ExcludeApp ID="Lync" /&gt;</code> : Exclut Skype Entreprise</li>
            <li><code>&lt;ExcludeApp ID="Publisher" /&gt;</code> : Exclut Publisher</li>
            <li><code>&lt;ExcludeApp ID="Access" /&gt;</code> : Exclut Access</li>
          </ul>

          <h2>Étape 3 : Activer votre licence Office</h2>

          <h3>Activation automatique (méthode recommandée)</h3>
          <p>Si vous avez inclus <code>PIDKEY</code> dans <code>configuration.xml</code>, l'activation est automatique :</p>
          <ol>
            <li>Ouvrez <strong>Word</strong> ou toute application Office</li>
            <li>Office se connecte aux serveurs Microsoft</li>
            <li>La clé est validée automatiquement</li>
            <li>Message "Produit activé" apparaît</li>
          </ol>

          <h3>Activation manuelle</h3>
          <p>Si l'activation automatique échoue ou si vous n'avez pas utilisé l'ODT :</p>
          <ol>
            <li>Ouvrez <strong>Word</strong></li>
            <li>Cliquez sur <strong>Fichier</strong> → <strong>Compte</strong></li>
            <li>Cliquez sur <strong>"Modifier la clé de produit"</strong></li>
            <li>Saisissez votre <strong>clé à 25 caractères</strong></li>
            <li>Cliquez sur <strong>"Installer"</strong></li>
            <li>Attendez la connexion aux serveurs Microsoft (5-30 secondes)</li>
            <li>Confirmation "Office est activé"</li>
          </ol>

          <h3>Vérifier l'état d'activation</h3>
          <p>Pour confirmer que votre licence est bien activée :</p>
          <ol>
            <li>Ouvrez n'importe quelle application Office</li>
            <li>Allez dans <strong>Fichier</strong> → <strong>Compte</strong></li>
            <li>Vérifiez "Produit activé" sous le nom du produit</li>
            <li>Vous devriez voir : <strong>"Microsoft Office Professional Plus 2021"</strong> (ou 2019/2024)</li>
          </ol>

          <h2>Résolution des problèmes d'activation</h2>

          <h3>Erreur 0xC004F074</h3>
          <p><strong>Cause</strong> : Le serveur KMS est introuvable (clé MAK/Retail requise).</p>
          <p><strong>Solution</strong> :</p>
          <ol>
            <li>Ouvrez PowerShell en administrateur</li>
            <li>Exécutez : <code>cscript "C:\Program Files\Microsoft Office\Office16\OSPP.VBS" /dstatus</code></li>
            <li>Si vous voyez "VOLUME_KMSCLIENT", votre clé est KMS (incompatible activation internet)</li>
            <li>Contactez notre <Link href="/support" className="text-blue-600 hover:underline">support</Link> pour obtenir une clé Retail</li>
          </ol>

          <h3>Erreur 0x8007000D</h3>
          <p><strong>Cause</strong> : Fichiers d'installation corrompus.</p>
          <p><strong>Solution</strong> :</p>
          <ol>
            <li>Désinstallez Office complètement</li>
            <li>Téléchargez l'<strong>outil de désinstallation Microsoft</strong> (aka "SaRA")</li>
            <li>Réinstallez Office avec un nouvel installateur téléchargé</li>
          </ol>

          <h3>Erreur "Clé déjà utilisée"</h3>
          <p><strong>Cause</strong> : La clé a déjà été activée sur un autre PC.</p>
          <p><strong>Solution</strong> :</p>
          <ol>
            <li>Désactivez la licence sur l'ancien PC (si accessible)</li>
            <li>PowerShell admin : <code>cscript "C:\Program Files\Microsoft Office\Office16\OSPP.VBS" /unpkey:XXXXX</code></li>
            <li>Si l'ancien PC n'est plus accessible, contactez notre support pour réinitialisation</li>
          </ol>

          <div className="bg-red-50 border-l-4 border-red-600 p-6 my-8">
            <p className="text-red-900 font-semibold mb-2">🚨 Attention aux clés illégales</p>
            <p className="text-red-800">
              Si votre clé refuse systématiquement l'activation, elle peut être frauduleuse. Achetez uniquement auprès de revendeurs Microsoft officiels comme AllKeyMasters.
            </p>
          </div>

          <h2>Configuration post-installation</h2>

          <h3>Personnaliser les options Office</h3>
          <p>Après activation, optimisez Office pour votre usage :</p>
          <ul>
            <li><strong>Thème sombre</strong> (Office 2021+) : Fichier → Compte → Thème Office → Noir</li>
            <li><strong>Enregistrement automatique</strong> : Fichier → Options → Enregistrement → Cocher "Enregistrer toutes les X min"</li>
            <li><strong>Corrections automatiques</strong> : Fichier → Options → Vérification → Personnaliser</li>
            <li><strong>QuickAccess Toolbar</strong> : Ajoutez vos commandes favorites (Enregistrer, Annuler, PDF)</li>
          </ul>

          <h3>Mises à jour</h3>
          <p>Office propose 2 canaux de mise à jour :</p>
          <ul>
            <li><strong>Semi-annuel</strong> (recommandé) : Mises à jour stables tous les 6 mois</li>
            <li><strong>Mensuel</strong> : Nouvelles fonctionnalités chaque mois (peut être instable)</li>
          </ul>
          <p>Pour vérifier : Fichier → Compte → Options de mise à jour.</p>

          <h2>Conclusion</h2>
          <p>
            L'installation et l'activation d'Office Professional Plus sont relativement simples si vous suivez la procédure officielle Microsoft. En cas de problème, notre <Link href="/support" className="text-blue-600 hover:underline">support technique français</Link> est disponible 7j/7 pour vous assister.
          </p>
          <p>
            Pour une activation garantie, achetez toujours des <Link href="/logiciels" className="text-blue-600 hover:underline">licences Microsoft authentiques</Link> auprès de revendeurs certifiés.
          </p>

          <div className="bg-gray-100 rounded-lg p-8 my-12">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Besoin d'une licence Office ?</h3>
            <p className="text-gray-700 mb-6">
              Licences Office Professional Plus 2019, 2021 et 2024 disponibles avec activation instantanée et support français inclus.
            </p>
            <Link
              href="/logiciels"
              className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voir les offres Office
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
