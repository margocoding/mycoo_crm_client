import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { LuArrowUpRight, LuCircleCheck, LuSave } from "react-icons/lu";
import { usePartnerStore } from "./partner.store";
import { EmptyState } from "./PartnerUI";
import type { Partner, PartnerStore, PayoutDetails } from "./partner.types";

const emptyDetails: PayoutDetails = { recipient: "", taxId: "", bank: "", account: "", bic: "", legalForm: "self-employed" };

function DetailsForm({ partner, updateDetails }: { partner: Partner; updateDetails: PartnerStore["updateDetails"] }) {
  const [details, setDetails] = useState<PayoutDetails>(() => ({ ...(partner.payoutDetails || emptyDetails) }));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function updateField<K extends keyof PayoutDetails>(field: K, value: PayoutDetails[K]) { setDetails((current) => ({ ...current, [field]: value })); setError(""); setSaved(false); }
  function submit(event: FormEvent) { event.preventDefault(); const result = updateDetails(partner.id, details); if (!result.ok) { setError(result.error); setSaved(false); return; } setError(""); setSaved(true); }

  return <>
    <div className="p-page-head"><div><span className="p-kicker">Кабинет партнёра</span><h1>Реквизиты</h1><p>Данные получателя для выплаты вознаграждения.</p></div></div>
    <section className="p-panel" aria-labelledby="details-form-title"><div className="p-panel-head"><h2 id="details-form-title">Получатель выплаты</h2></div><form className="p-form" onSubmit={submit} noValidate aria-describedby={error ? "details-error" : undefined}>
      <div className="p-grid-2"><label className="p-field"><span>Форма работы</span><select value={details.legalForm} onChange={(event) => updateField("legalForm", event.target.value as PayoutDetails["legalForm"])}><option value="self-employed">Самозанятый</option><option value="entrepreneur">Индивидуальный предприниматель</option><option value="company">Юридическое лицо</option></select></label><label className="p-field"><span>ИНН</span><input required inputMode="numeric" autoComplete="off" maxLength={12} value={details.taxId} onChange={(event) => updateField("taxId", event.target.value.replace(/\D/g, ""))} placeholder={details.legalForm === "company" ? "7700000000" : "770000000001"} aria-describedby="tax-id-hint" /><small className="p-muted" id="tax-id-hint">{details.legalForm === "company" ? "10 цифр для юридического лица" : "12 цифр для ИП или самозанятого"}</small></label></div>
      <label className="p-field"><span>{details.legalForm === "company" ? "Наименование организации" : "ФИО получателя"}</span><input required autoComplete="off" maxLength={160} value={details.recipient} onChange={(event) => updateField("recipient", event.target.value)} placeholder={details.legalForm === "company" ? "ООО «Компания Пример»" : "Иванов Иван Иванович"} /></label>
      <h3>Банковские реквизиты</h3><label className="p-field"><span>Название банка</span><input required autoComplete="off" maxLength={160} value={details.bank} onChange={(event) => updateField("bank", event.target.value)} placeholder="АО «Пример Банк»" /></label>
      <div className="p-grid-2"><label className="p-field"><span>Расчётный счёт</span><input required autoComplete="off" inputMode="numeric" maxLength={20} value={details.account} onChange={(event) => updateField("account", event.target.value.replace(/\D/g, ""))} placeholder="40702810000000000001" aria-describedby="account-hint" /><small className="p-muted" id="account-hint">20 цифр</small></label><label className="p-field"><span>БИК</span><input required autoComplete="off" inputMode="numeric" maxLength={9} value={details.bic} onChange={(event) => updateField("bic", event.target.value.replace(/\D/g, ""))} placeholder="044000001" aria-describedby="bic-hint" /><small className="p-muted" id="bic-hint">9 цифр</small></label></div>
      <p className="p-muted">Изменения будут использоваться в новых заявках. Реквизиты уже отправленных заявок сохранятся.</p>
      {error ? <div className="p-notice warning" id="details-error" role="alert"><p>{error}</p></div> : null}
      {saved ? <div className="p-notice success" role="status"><LuCircleCheck aria-hidden="true" /><div><strong>Реквизиты сохранены</strong><p>Теперь их можно использовать для выплаты.</p></div></div> : null}
      <div className="p-actions"><button className="p-button primary" type="submit"><LuSave aria-hidden="true" /> Сохранить реквизиты</button>{saved ? <Link className="p-button" to="/partner/account/payouts">К выплатам <LuArrowUpRight aria-hidden="true" /></Link> : null}</div>
    </form></section>
  </>;
}

export function PartnerDetails() {
  const data = usePartnerStore();
  const partner = data.partners.find((item) => item.id === data.currentPartnerId);
  return partner ? <DetailsForm key={partner.id} partner={partner} updateDetails={data.updateDetails} /> : <EmptyState title="Выберите партнёра" />;
}

export default PartnerDetails;
