import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Save, X, Loader2 } from "lucide-react";
import {
  fetchAfastamentosByMatricula,
  createAfastamento,
  updateAfastamento,
  deleteAfastamento,
} from "../../services/militarService";

// Tipos válidos definidos localmente (sem dependência de mockData)
const TIPOS_AFASTAMENTO = ["FÉRIAS NÃO GOZADAS", "LTIP"];

const emptyForm = { tipo: "", dias: "", processoSeiMilitar: "", obs: "" };

export default function AfastamentosCrud({ matricula, onChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await fetchAfastamentosByMatricula(matricula);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [matricula]);

  const openNew = () => { setForm({ ...emptyForm }); setEditingId(null); };

  const openEdit = (item) => {
    setForm({
      tipo: item.tipo,
      dias: String(item.dias),
      processoSeiMilitar: item.processoSeiMilitar || "",
      obs: item.obs || "",
    });
    setEditingId(item.id);
  };

  const handleSave = async () => {
    if (!form.tipo || !form.dias) return;
    setSaving(true);
    const payload = {
      tipo: form.tipo,
      dias: parseInt(form.dias, 10),
      processoSeiMilitar: form.processoSeiMilitar || undefined,
      obs: form.obs || undefined,
    };
    if (editingId) {
      await updateAfastamento(editingId, matricula, payload);
    } else {
      await createAfastamento(matricula, payload);
    }
    setSaving(false);
    setForm(null);
    setEditingId(null);
    await load();
    onChange?.();
  };

  const handleDelete = async (item) => {
    setSaving(true);
    await deleteAfastamento(item.id, matricula);
    setSaving(false);
    await load();
    onChange?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} registro(s)</p>
        <Button variant="outline" size="sm" onClick={openNew} disabled={!!form}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>

      {form && (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="space-y-2">
            <Label className="text-xs">Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {TIPOS_AFASTAMENTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Dias</Label>
            <Input type="number" value={form.dias} onChange={(e) => setForm({ ...form, dias: e.target.value })} className="h-9" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Processo SEI Militar</Label>
            <Input value={form.processoSeiMilitar} onChange={(e) => setForm({ ...form, processoSeiMilitar: e.target.value })} className="h-9" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Observações</Label>
            <Textarea value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} rows={2} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setForm(null); setEditingId(null); }}>
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="border border-border rounded-lg p-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{item.tipo}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{item.dias} dias</span>
              </div>
              {item.processoSeiMilitar && (
                <p className="text-xs text-muted-foreground mt-1">SEI: {item.processoSeiMilitar}</p>
              )}
              {item.obs && <p className="text-xs text-muted-foreground mt-0.5">{item.obs}</p>}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}