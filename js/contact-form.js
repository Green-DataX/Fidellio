(function () {
  const MAIL = "contact@fideliio.com";

  function buildMailto() {
    const name = document.getElementById("contactName")?.value.trim() || "";
    const email = document.getElementById("contactEmail")?.value.trim() || "";
    const subjectEl = document.getElementById("contactSubject");
    const message = document.getElementById("contactMessage")?.value.trim() || "";
    const opt = subjectEl?.selectedOptions[0];
    const topic = opt ? opt.textContent.trim() : "";

    const subject = encodeURIComponent(`[Fideliio] ${topic} — ${name || "Contact"}`);
    const body = encodeURIComponent(
      ["Nom : " + name, "Email : " + email, "Sujet : " + topic, "", "Message :", message].join("\n")
    );
    return `mailto:${MAIL}?subject=${subject}&body=${body}`;
  }

  function onSubmit(e) {
    e.preventDefault();
    const form = document.getElementById("contactForm");
    if (!form) return;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    window.location.href = buildMailto();
  }

  function bind() {
    const form = document.getElementById("contactForm");
    if (!form || form.dataset.bound === "1") return;
    form.dataset.bound = "1";
    form.addEventListener("submit", onSubmit);
  }

  document.addEventListener("fideliio:components-loaded", bind);
})();
