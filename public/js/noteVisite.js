document.addEventListener('DOMContentLoaded', () => {
  const urlParamsLocal = new URLSearchParams(window.location.search);
  const hubspotIdLocal = urlParamsLocal.get('id_hubspot');
  
  if (hubspotIdLocal) {
    const btnSaveNote = document.getElementById('btn-save-note');
    const newNoteTextarea = document.getElementById('new_note');
    const btnViewNotes = document.getElementById('btn-view-notes');
    const notesModal = document.getElementById('notes-modal');
    const closeNotesModal = document.getElementById('close-notes-modal');
    const notesList = document.getElementById('notes-list');

    let notesGlobales = [];
    let currentUser = "Commercial";

    function formatEmailToName(email) {
      if (!email) return "Commercial";
      const namePart = email.split('@')[0]; 
      const parts = namePart.split('.'); 
      return parts.map(part => {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join(' ');
    }

    async function initialiserNotes() {
      const resConfig = await fetch('/api/config');
      const config = await resConfig.json();
      const supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

      const { data: authData } = await supabase.auth.getSession();
      if (authData && authData.session && authData.session.user && authData.session.user.email) {
        currentUser = formatEmailToName(authData.session.user.email);
      }

      const { data } = await supabase
        .from('historique_visites')
        .select('commentaires')
        .eq('hubspot_id', hubspotIdLocal)
        .maybeSingle();

      if (data && data.commentaires) {
        notesGlobales = data.commentaires;
      }
      
      window.supabaseInstance = supabase; 
    }

    function displayNotes() {
      notesList.innerHTML = '';
      if (notesGlobales.length === 0) {
        notesList.innerHTML = '<li style="color: #888; font-style: italic;">Aucune note pour le moment.</li>';
        return;
      }

      [...notesGlobales].reverse().forEach(note => {
        const li = document.createElement('li');
        li.style.borderBottom = '1px solid #ddd';
        li.style.padding = '12px 0';

        const safeTextHTML = note.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        
        li.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px;">
            <div style="font-size: 11px; color: #555;">
              <strong style="color: #002ab6;">[${note.date}]</strong> par <strong>${note.user}</strong> :
            </div>
            <button type="button" class="btn-copy-note" style="background: #eee; border: 1px solid #ccc; border-radius: 4px; font-size: 10px; cursor: pointer; padding: 2px 6px;"> 
              📋 Copier
            </button>
          </div>
          <div style="font-size: 13px; color: #333; line-height: 1.4; white-space: pre-wrap;">${safeTextHTML}</div>
        `;
        
        const copyBtn = li.querySelector('.btn-copy-note');
        
        copyBtn.addEventListener('click', function() {
          navigator.clipboard.writeText(note.text).then(() => {
            this.textContent = 'Copié !';
            setTimeout(() => this.textContent = '📋 Copier', 2000);
          }).catch(err => {
            console.error("Erreur de copie :", err);
            this.textContent = '❌ Erreur';
          });
        });
        notesList.appendChild(li);
      });
    }

    btnSaveNote.addEventListener('click', async () => {
      const noteText = newNoteTextarea.value.trim();
      if (!noteText) return;

      btnSaveNote.textContent = "⏳ Sauvegarde...";
      btnSaveNote.disabled = true;

      const d = new Date();
      const datePropre = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

      const nouvelleNote = {
        date: datePropre,
        user: currentUser,
        text: noteText
      };

      notesGlobales.push(nouvelleNote);

      const { error } = await window.supabaseInstance
        .from('historique_visites')
        .upsert({
          hubspot_id: hubspotIdLocal,
          commentaires: notesGlobales
        }, { onConflict: 'hubspot_id' });

      if (error) {
        alert("Erreur lors de la sauvegarde : " + error.message);
      } else {
        newNoteTextarea.value = '';
        if (notesModal.style.display === 'block') {
          displayNotes();
        }
      }
      
      btnSaveNote.textContent = "Sauvegarder la note";
      btnSaveNote.disabled = false;
    });

    btnViewNotes.addEventListener('click', () => {
      displayNotes();
      notesModal.style.display = 'block';
    });

    closeNotesModal.addEventListener('click', () => {
      notesModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
      if (event.target == notesModal) {
        notesModal.style.display = 'none';
      }
    });

    initialiserNotes();

    if (urlParamsLocal.get('open_notes') === 'true') {
      setTimeout(() => {
        btnViewNotes.click();
      }, 500);
    }
    
  }
});
