const eid = (elementId) => document.getElementById(elementId);

const shortSelector = eid("short");
const urlSelector = eid("url");
const addContainer = eid("addContainer")
const gridContainer = eid("gridContainer");
const prevNumbersButton = eid("previousItems");
const moreNumbersButton = eid("moreItems");

let pageNumber = 1;
let moreNumbers = false;
let previousNumbers = false;

function editRow(rowId) {
    try {
        const short = eid(`updateShort-${rowId}`).value;
        const url = eid(`updateURL-${rowId}`).value;
        const response =  fetch(
            "/edit",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({short: short, url: url, id: rowId}),
            }
        ).then(() => fetchData(pageNumber));
    } catch (e) {
        console.log(`Error updating ${rowId}: ${e}`);
    }
}

function deleteRow(rowId) {
    // Get the modal
    const modal = eid("confirmationModal");

    // Get the elements that can close the modal
    const closeButton = document.getElementsByClassName("close-button")[0];
    const cancelButton = eid("cancelButton");
    const confirmButton = eid("confirmButton");
    const short = eid(`short-${rowId}`).innerText;
    eid("deleteConfirmMsg").innerText = `This will remove the entry for ${short}.`
    modal.style.display = "block"
    // When the user clicks on (x) or "Cancel", close the modal
    closeButton.addEventListener(
        "click",
        () => modal.style.display = "none"
    )

    cancelButton.addEventListener(
        "click",
        () => modal.style.display = "none"
    )

    // When the user clicks on "Confirm", perform the action and close the modal
    confirmButton.onclick = function() {
      try {
          fetch(
              "/edit",
              {
                  method: "DELETE",
                  headers: {
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify({id: rowId})
              }).then(() => fetchData(pageNumber));
      } catch (e) {
          console.log(`Error deleting row ${rowId}: ${e}`);
      }

      modal.style.display = "none";
    }
    
    window.onclick = function(event) {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    }
}

async function fetchData(page) {
    function generateDivs(row) {
        return `
        <div id="short-${row.id}" class="item-cell">${row.short}</div>
        <div id="url-${row.id}" class="url-cell">${row.url}</div>
        <div class="item-cell">
            <div id="edit-${row.id}" style="display: block">✏️</div>
            <div id="save-${row.id}" style="display: none">✅</div>
        </div>
        <div id="delete-${row.id}" class="item-cell">➖</div>`
    }

    function addHandlers(rowId) {
        eid(`edit-${rowId}`).addEventListener(
            "click",
            () => {
                const shortText = eid(`short-${rowId}`).innerText;
                const urlText = eid(`url-${rowId}`).innerText;
                eid(`short-${rowId}`).innerHTML = `<input style="width: 180px;" id="updateShort-${rowId}" value="${shortText}">`;
                eid(`url-${rowId}`).innerHTML = `<input style="width: 380px;" id="updateURL-${rowId}" value="${urlText}">`;
                eid(`edit-${rowId}`).style.display = "none";
                eid(`save-${rowId}`).style.display = "block";
            }
        )
        eid(`save-${rowId}`).addEventListener(
            "click",
            () => editRow(rowId)
        )
        eid(`delete-${rowId}`).addEventListener(
            "click",
            () => {
                deleteRow(rowId);
            }
        )
    }

    let pageValue = page || 1;
    let url = `/edit?api=fetch&page=${pageValue}`

    try {
        const response = await fetch(
            url,
            {
                method: "GET",
            }
        );
        const result = await response.json();
        gridContainer.innerHTML = result.items.map(generateDivs).join("");
        result.items.forEach(
            (x) => addHandlers(x.id)
        );
        moreNumbers = result.moreItems;
        previousNumbers = result.previousItems;
        pageNumber = result.page;
    }
    catch (e) {
        console.log(`Error: ${e}`);
    } finally {
        if (moreNumbers) {
            moreNumbersButton.style.display = "block";
        } else {
            moreNumbersButton.style.display = "none";
        }
        if (previousNumbers) {
            prevNumbersButton.style.display = "block";
        } else {
            prevNumbersButton.style.display = "none";
        }
    }
}

eid("newButton").addEventListener(
    "click",
    () => {
        if (addContainer.style.display === "grid") {
            addContainer.style.display = "none";
        } else {
            addContainer.style.display = "grid";
        }
    }
);

eid("addLinkButton").addEventListener(
    "click",
    () => {
        const short = shortSelector.value;
        const url = urlSelector.value;

        async function addItem() {
            try {
                const response = await fetch(
                    "/edit",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({short: short, url: url}),
                    }
                );
                const result = await response.json();
                console.log("Success:", result);
                shortSelector.value = '';
                urlSelector.value = '';
                addContainer.style.display = 'none';
                await fetchData(pageNumber);
            }
            catch (error) {
                console.error("Error:", error);
            }
        }
        addItem();
    }
)

fetchData(pageNumber);