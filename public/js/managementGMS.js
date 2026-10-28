// ==========================================
// SCRIPT GMS MANAGEMENT
// ==========================================
const MANAGERS = ["leo.blanchet@briquehouse.fr", "romane.polet@briquehouse.fr"];
let supabaseClient;
let objectifsDuMois = [];

// 1. Initialisation au chargement
document.addEventListener("DOMContentLoaded", async () => {
    // Définir le mois en cours par défaut
    const now = new Date();
    const moisActuel = `now.getFullYear()-{String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('input-mois').value = moisActuel;
    
    await initialiserSupabase();
    await verifierDroitsAcces();
    
    // Écouteurs de changements
    document.getElementById('input-mois').addEventListener('change', chargerObjectifsMois);
    document.getElementById('input-commercial').addEventListener('change', preRemplirFormulaire);
});

// 2. Connexion Supabase
async function initialiserSupabase() {
    try {
        const reponse = await fetch('/api/config');
        const config = await reponse.json();
        supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    } catch (err) {
        console.error("Erreur config Supabase :", err);
    }
}

// 3. Sécurité : Vérifier si l'utilisateur est Manager
async function verifierDroitsAcces() {
    try {
        const reponse = await fetch('/api/config');
        const data = await reponse.json();
        const emailUser = data.emailActuel || localStorage.getItem('backup_email_utilisateur') || "";

        if (MANAGERS.includes(emailUser.toLowerCase())) {
            document.getElementById('manager-content').style.display = 'block';
            await chargerObjectifsMois(); // On charge les datas si accès OK
        } else {
            document.getElementById('access-denied').style.display = 'block';
        }
    } catch (err) {
        console.error("Erreur de vérification des droits :", err);
    }
}

// 4. Charger et afficher les objectifs du mois sélectionné
async function chargerObjectifsMois() {
    const moisCible = document.getElementById('input-mois').value;
    document.getElementById('titre-recap-mois').innerText = moisCible;

    try {
        const { data, error } = await supabaseClient
            .from('objectifs_mensuels')
            .select('*')
            .eq('mois', moisCible);

        if (error) throw error;

        objectifsDuMois = data || [];
        afficherTableau(objectifsDuMois);
        preRemplirFormulaire(); // Met à jour les inputs selon le commercial sélectionné

    } catch (e) {
        console.error("Erreur lors du chargement des objectifs :", e);
    }
}

// 5. Afficher le tableau récapitulatif
function afficherTableau(donnees) {
    const tbody = document.getElementById('tbody-objectifs');
    tbody.innerHTML = '';

    if (donnees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888;">Aucun objectif défini pour ce mois.</td></tr>';
        return;
    }

    donnees.forEach(obj => {
        // Petit formatage rapide pour le nom
        const nomFormate = obj.email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${nomFormate}</b></td>
            <td>${obj.obj_dn} pts</td>
            <td>${obj.obj_mea} HL</td>
            <td>${obj.obj_direct} Mag.</td>
        `;
        tbody.appendChild(tr);
    });
}

// 6. Pré-remplir les champs si un objectif existe déjà pour ce mois/commercial
function preRemplirFormulaire() {
    const emailSelectionne = document.getElementById('input-commercial').value.toLowerCase();
    const objExistant = objectifsDuMois.find(o => o.email === emailSelectionne);

    if (objExistant) {
        document.getElementById('input-dn').value = objExistant.obj_dn;
        document.getElementById('input-mea').value = objExistant.obj_mea;
        document.getElementById('input-direct').value = objExistant.obj_direct;
    } else {
        document.getElementById('input-dn').value = '';
        document.getElementById('input-mea').value = '';
        document.getElementById('input-direct').value = '';
    }
}

// 7. Sauvegarder dans Supabase (Upsert : Créé ou Met à jour)
async function sauvegarderObjectif() {
    const btn = document.querySelector('.btn-save');
    const mois = document.getElementById('input-mois').value;
    const email = document.getElementById('input-commercial').value;
    const obj_dn = parseFloat(document.getElementById('input-dn').value) || 0;
    const obj_mea = parseFloat(document.getElementById('input-mea').value) || 0;
    const obj_direct = parseFloat(document.getElementById('input-direct').value) || 0;

    if (!mois) return alert("Veuillez sélectionner un mois.");

    btn.innerText = "⏳ Sauvegarde...";
    
    try {
        const { error } = await supabaseClient
            .from('objectifs_mensuels')
            .upsert({ 
                mois: mois, 
                email: email, 
                obj_dn: obj_dn, 
                obj_mea: obj_mea, 
                obj_direct: obj_direct 
            }, { onConflict: 'mois,email' });

            if (error) throw error;

            btn.innerText = "✅ Succès !";
            setTimeout(() => btn.innerText = "💾 Enregistrer cet objectif", 2000);

            // On recharge le tableau pour afficher la modification
            chargerObjectifsMois();

            } catch (e) {
                console.error("Erreur sauvegarde :", e);
                btn.innerText = "❌ Erreur";
                setTimeout(() => btn.innerText = "💾 Enregistrer cet objectif", 2000);
            }
      }
}
