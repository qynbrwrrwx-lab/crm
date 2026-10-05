// Tâches : contenu et nom du fichier calendrier, sans accès au DOM.

function icsDate(value){return new Date(value).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/, "Z");}

function icsText(value){return String(value||"").replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");}

function getAppointmentCalendarData(item, now = new Date()) {
  if (!item?.startDate) return null;

  const end = item.endDate || new Date(new Date(item.startDate).getTime() + 3600000);
  const description = [
    item.notes,
    `Client : ${taskContactLabel(item)}`,
    item.freeContactEmail && `E-mail : ${item.freeContactEmail}`,
    item.freeContactPhone && `Téléphone : ${item.freeContactPhone}`
  ].filter(Boolean).join("\n");
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//My Prospect//Agenda//FR",
    "BEGIN:VEVENT",
    `UID:${item._id}@my-prospect`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(item.startDate)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(item.title)}`,
    `DESCRIPTION:${icsText(description)}`,
    item.location ? `LOCATION:${icsText(item.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR"
  ].filter(Boolean).join("\r\n");
  const name = String(item.title).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "my-prospect";

  return { content, filename: `rendez-vous-${name}.ics` };
}
