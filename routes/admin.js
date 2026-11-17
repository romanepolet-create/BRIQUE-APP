app.get('/admin/users', verifierBriqueHouse, requireRole([]), async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/admin/update-role', verifierBriqueHouse, requireRole([]), async (req, res) => {
  const { targetUserId, newRole } = req.body;
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId);
    
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Rôle mis à jour avec succès" });
});
