export type RequestEmail = {
  reference: string; area: string; concern: string; guide: boolean;
  name: string; email: string; subject: string; replySubject: string;
  fields: { label: string; value: string }[];
  files: { filename: string }[];
  message: string;
};
const escape = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]!);
const lines = (value: string) => escape(value).replace(/\r\n|\r|\n/g, '<br>');

/** Pure and deterministic: retries must produce the same provider payload. */
export function renderRequestEmail(request: RequestEmail): { text: string; html: string } {
  const kind = request.guide ? 'Rückfrage zur Anleitung' : 'Neue Anfrage';
  const replyUrl = 'mailto:' + encodeURIComponent(request.email) + '?subject=' + encodeURIComponent('Re: ' + request.replySubject);
  const heading = (text: string) => `<h2 style="margin:28px 0 10px;font-size:18px;line-height:26px;color:#102d45;">${text}</h2>`;
  const row = (label: string, value: string) => `<tr><th scope="row" align="left" valign="top" width="36%" style="padding:11px 12px 11px 0;border-bottom:1px solid #e6dfd4;font-size:14px;line-height:22px;color:#465568;font-weight:600;overflow-wrap:anywhere;word-break:break-word;">${lines(label)}</th><td valign="top" style="padding:11px 0;border-bottom:1px solid #e6dfd4;font-size:16px;line-height:24px;color:#102d45;overflow-wrap:anywhere;word-break:break-word;">${value}</td></tr>`;
  const table = (rows: string, label: string) => `<table class="mail-details" aria-label="${label}" width="100%" cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed;border-collapse:collapse;">${rows}</table>`;
  const contact = table((request.name ? row('Name', lines(request.name)) : '') + row('E-Mail', `<a href="mailto:${escape(encodeURIComponent(request.email))}" style="color:#00458f;text-decoration:underline;">${escape(request.email)}</a>`), 'Kontakt');
  const fields = request.fields.length ? heading('Weitere Angaben') + table(request.fields.map(field => row(field.label, lines(field.value || 'Nicht angegeben'))).join(''), 'Weitere Angaben') : '';
  const attachments = request.files.length
    ? `<ul style="margin:8px 0 0;padding-left:20px;">${request.files.map(file => `<li style="margin:5px 0;overflow-wrap:anywhere;word-break:break-word;">${escape(file.filename)}</li>`).join('')}</ul>`
    : '<p style="margin:0;color:#465568;">Keine Anhänge.</p>';
  const text = [
    'ELIM KIRCHE · SERVICEPORTAL', kind, '',
    'Betreff: ' + request.subject, 'Vorgangsnummer: ' + request.reference,
    'Bereich: ' + request.area, 'Anliegen: ' + request.concern,
    'Art: ' + (request.guide ? 'Rückfrage zur Anleitung' : 'Formular'), '',
    'KONTAKT', request.name ? 'Name: ' + request.name : 'Name: nicht angegeben',
    'E-Mail: ' + request.email, '',
    ...(request.fields.length ? ['WEITERE ANGABEN', ...request.fields.map(field => field.label + ': ' + (field.value || '–')), ''] : []),
    'NACHRICHT', request.message, '',
    'ANHÄNGE', ...(request.files.length ? request.files.map(file => '- ' + file.filename) : ['Keine Anhänge.']), '',
    'Zum Antworten bitte die Antwortfunktion deines E-Mail-Programms verwenden.',
    'Die Antwort geht an ' + request.email + '.',
  ].join('\n');
  const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(request.subject)}</title>
<style>body,table,td,th,p,a,h1,h2{font-family:Arial,Helvetica,sans-serif;}@media screen and (max-width:480px){.mail-details th,.mail-details td{display:block!important;width:auto!important;}.mail-details th{padding-bottom:2px!important;border-bottom:0!important;}.mail-details td{padding-top:0!important;padding-bottom:12px!important;}}</style></head>
<body style="margin:0;padding:0;background-color:#ece7de;color:#102d45;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escape(kind + ' für ' + request.area + ' · ' + request.reference)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ece7de" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="640" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;border-collapse:separate;border-spacing:0;background-color:#fffdf9;border:1px solid #d9cebe;border-radius:12px;overflow:hidden;">
<tr><td bgcolor="#102d45" style="padding:28px 24px;background-color:#102d45;color:#ffffff;border-radius:12px 12px 0 0;">
<p style="margin:0 0 24px;font-size:15px;line-height:22px;font-weight:bold;color:#ffffff;">Elim Kirche <span style="color:#b9ccdb;">| Serviceportal</span></p>
<p style="margin:0 0 8px;color:#d6e2ec;font-size:13px;line-height:20px;letter-spacing:1px;text-transform:uppercase;">${escape(kind)}</p>
<h1 style="margin:0 0 12px;font-size:25px;line-height:34px;font-weight:bold;overflow-wrap:anywhere;word-break:break-word;color:#ffffff;">${lines(request.subject)}</h1>
<p style="margin:0;color:#d6e2ec;font-size:14px;line-height:22px;">Vorgangsnummer: <strong style="color:#ffffff;">${escape(request.reference)}</strong></p>
</td></tr>
<tr><td style="padding:0 24px 28px;">
${heading('Anliegen')}${table(row('Bereich', lines(request.area)) + row('Anliegen', lines(request.concern)), 'Anliegen')}
${heading('Kontakt')}${contact}
${fields}
${heading('Nachricht')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;"><tr><td bgcolor="#f3eee5" style="padding:18px 20px;background-color:#f3eee5;border-left:3px solid #34526c;border-radius:0 8px 8px 0;font-size:16px;line-height:26px;overflow-wrap:anywhere;word-break:break-word;">${lines(request.message)}</td></tr></table>
${heading('Anhänge' + (request.files.length ? ' (' + request.files.length + ')' : ''))}${attachments}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;max-width:100%;"><tr><td bgcolor="#17466b" style="border-radius:8px;background-color:#17466b;text-align:center;"><a href="${escape(replyUrl)}" style="display:inline-block;padding:13px 20px;border:1px solid #17466b;border-radius:8px;color:#ffffff;font-size:16px;line-height:24px;font-weight:bold;text-decoration:none;">Per E-Mail antworten</a></td></tr></table>
<p style="margin:14px 0 0;color:#465568;font-size:14px;line-height:22px;">Du kannst auch die Antwortfunktion deines E-Mail-Programms verwenden. Die Antwort wird an die oben angegebene E-Mail-Adresse adressiert.</p>
</td></tr>
<tr><td bgcolor="#f3eee5" style="padding:16px 24px;background-color:#f3eee5;border-top:1px solid #e6dfd4;color:#465568;font-size:13px;line-height:20px;border-radius:0 0 12px 12px;">Übermittelt über das Elim Kirche Serviceportal.</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
  return { text, html };
}
