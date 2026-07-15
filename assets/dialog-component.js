class VehicleSelector extends HTMLElement {
    constructor() {
        super();
        this.data = {};
    }

    connectedCallback() {
        this.render();
        this.fetchData();
    }

    async fetchData() {
        try {
            const res = await fetch("http://srv1076007.hstgr.cloud/api/vehicles");
            this.data = await res.json();
            this.populateYears();
        } catch (e) {
            console.error("Failed to load vehicle API", e);
        }
    }

    render() {
        this.innerHTML = `
            <select id="yearSelect">
                <option value="">Any Year</option>
            </select>

            <select id="makeSelect" disabled>
                <option value="">Any Make</option>
            </select>

            <select id="modelSelect" disabled>
                <option value="">Any Model</option>
            </select>

            <button id="searchBtn">Search</button>
        `;

        this.yearSelect = this.querySelector("#yearSelect");
        this.makeSelect = this.querySelector("#makeSelect");
        this.modelSelect = this.querySelector("#modelSelect");
        this.searchBtn = this.querySelector("#searchBtn");

        this.yearSelect.addEventListener("change", () => this.onYearChange());
        this.makeSelect.addEventListener("change", () => this.onMakeChange());

        this.searchBtn.addEventListener("click", () => this.runSearch());
    }

    clean(str) {
        return str
            .trim()
            .replace(/[-\s]+/g, '_')
            .replace(/[^A-Za-z0-9_]/g, '');
    }

    populateYears() {
        const years = Object.keys(this.data)
         .filter(y => y !== '0000' && y !== '')
            .sort((a, b) => Number(b) - Number(a));

        years.forEach(y => {
            const opt = document.createElement("option");
            opt.value = y;
            opt.textContent = y;
            this.yearSelect.appendChild(opt);
        });
    }

    onYearChange() {
        const year = this.yearSelect.value;

        this.makeSelect.innerHTML = `<option value="">Any Make</option>`;
        this.modelSelect.innerHTML = `<option value="">Any Model</option>`;
        this.makeSelect.disabled = false;
        this.modelSelect.disabled = true;

        if (!year) return;

        const makes = Object.keys(this.data[year])
        .filter(md => md !== '' && md.trim() !== '')
        .sort();
        makes.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m;
            opt.textContent = m;
            this.makeSelect.appendChild(opt);
        });
    }

    onMakeChange() {
        const year = this.yearSelect.value;
        const make = this.makeSelect.value;

        this.modelSelect.innerHTML = `<option value="">Any Model</option>`;
        this.modelSelect.disabled = false;

        if (!make) return;

        const models = this.data[year][make]
        .filter(md => md !== '' && md.trim() !== '')
        .sort();
        models.forEach(md => {
            const opt = document.createElement("option");
            opt.value = md;
            opt.textContent = md;
            this.modelSelect.appendChild(opt);
        });
    }

    runSearch() {
        let year = this.clean(this.yearSelect.value || "any");
        let make = this.clean(this.makeSelect.value || "any");
        let model = this.clean(this.modelSelect.value || "any");

        const q = `${year}_${make}_${model}`;

        window.location.href = `/pages/search-vehicle-1?q=${q}`;

        document.getElementById("vehicleDialog").classList.remove("active");
    }
}

customElements.define("vehicle-selector", VehicleSelector);

class MachineSelector extends HTMLElement {
    constructor() {
        super();
        this.data = {};
    }

    connectedCallback() {
        this.render();
        this.fetchData();
    }

    async fetchData() {
        try {
            // const res = await fetch("http://localhost:8000/api/vehicles/makes-models");
            const res = await fetch("http://srv1076007.hstgr.cloud/api/vehicles/makes-models");
            this.data = await res.json();
            this.populateMakes();
        } catch (e) {
            console.error("Failed to load vehicle API", e);
        }
    }

    render() {
        this.innerHTML = `
            <select id="makeSelect">
                <option value="">Any Make</option>
            </select>

            <select id="modelSelect" disabled>
                <option value="">Any Model</option>
            </select>

            <button id="searchBtn">Search</button>
        `;

        this.makeSelect = this.querySelector("#makeSelect");
        this.modelSelect = this.querySelector("#modelSelect");
        this.searchBtn = this.querySelector("#searchBtn");

        this.makeSelect.addEventListener("change", () => this.onMakeChange());
        this.searchBtn.addEventListener("click", () => this.runSearch());
    }

    clean(str) {
        return str
            .trim()
            .replace(/[-\s]+/g, '_')
            .replace(/[^A-Za-z0-9_]/g, '');
    }

    populateMakes() {
    const makes = Object.keys(this.data)
        .filter(m => m !== '' && m.trim() !== '')
        .filter(m => !/^\d/.test(m))  // ✅ Remove makes starting with numbers
        .filter(m => !/^\d+$/.test(m)) // ✅ Remove purely numeric makes
        .filter(m => m !== 'Availability')
        .sort();

    makes.forEach(make => {
        const opt = document.createElement("option");
        opt.value = make;
        opt.textContent = make;
        this.makeSelect.appendChild(opt);
    });
}

    onMakeChange() {
        const selectedMake = this.makeSelect.value;

        this.modelSelect.innerHTML = `<option value="">Any Model</option>`;
        this.modelSelect.disabled = !selectedMake;

        if (!selectedMake) return;

        const models = this.data[selectedMake] || [];

        models.sort().forEach(model => {
            const opt = document.createElement("option");
            opt.value = model;
            opt.textContent = model;
            this.modelSelect.appendChild(opt);
        });
    }

    runSearch() {
        const makeRaw = this.makeSelect.value;
        const modelRaw = this.modelSelect.value;

        if (!makeRaw) {
            alert("Please select a make");
            return;
        }

        const parts = [this.clean(makeRaw)];

        if (modelRaw) {
            parts.push(this.clean(modelRaw));
        }

        const q = parts.join("_");

        window.location.href = `/pages/search-machine?q=${q}`;

        const dialog = document.getElementById("machineDialog");
        if (dialog) dialog.classList.remove("active");
    }
}

customElements.define("machine-selector", MachineSelector);


document.addEventListener("DOMContentLoaded", () => {
    const dialog = document.getElementById("vehicleDialog");
    const triggers = document.querySelectorAll(".js-dialog-trigger");
    const closeBtn = document.querySelector(".js-dialog-close");

    triggers.forEach(trigger => {
        trigger.addEventListener("click", () => {
            trigger.classList.toggle("active");
            dialog.classList.toggle("active");
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            closeBtn.classList.toggle("active");
            dialog.classList.toggle("active");
        });
    }

    const machineDialog = document.getElementById("machineDialog");
    const machineTriggers = document.querySelectorAll(".js-machine-dialog-trigger");
    const machineCloseBtn = document.querySelector(".js-machine-dialog-close");

    machineTriggers.forEach(trigger => {
        trigger.addEventListener("click", () => {
            trigger.classList.toggle("active");
            machineDialog.classList.toggle("active");
        });
    });

    if (machineCloseBtn) {
        machineCloseBtn.addEventListener("click", () => {
            machineCloseBtn.classList.toggle("active");
            machineDialog.classList.toggle("active");
        });
    }
});
