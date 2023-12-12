const eid = (elementId) => document.getElementById(elementId);

const shortSelector = eid("short");
const urlSelector = eid("url");
const addContainer = eid("addContainer")
const gridContainer = eid("gridContainer");
const prevNumbersButton = eid("previousItems");
const moreNumbersButton = eid("moreItems");

let pageNumber = 1;
let filterText;


function showError(errorMessage) {
    eid("errorMsg").innerText = errorMessage;
    eid("errorModal").style.display = "block";
    eid("errorCloseButton").addEventListener(
    "click",
    () => eid("errorModal").style.display = "none"
    );
    const modal = eid("errorModal");
    // also close modal when user clicks outside the modal
    window.onclick = function(event) {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    }
}

function editRow(rowId) {
    try {
        const short = eid(`updateShort-${rowId}`).value;
        const url = eid(`updateURL-${rowId}`).value;
        fetch(
            "/edit",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({short: short, url: url, id: rowId}),
            }
        ).then(
            (response) => {
                if (response.status === 400) {
                    response.json().then(
                        (result) => {
                            showError(result.data);
                        })
                } else {
                    fetchData(pageNumber);
                }
        });
    } catch (e) {
        showError(e);
    }
}

function deleteRow(rowId) {
    const modal = eid("confirmationModal");
    const closeButton = eid("closeButton");
    const cancelButton = eid("cancelButton");
    const confirmButton = eid("confirmButton");
    const short = eid(`short-${rowId}`).innerText;
    eid("deleteConfirmMsg").innerText = `This will remove the entry for ${short}.`
    modal.style.display = "block"

    closeButton.addEventListener(
        "click",
        () => modal.style.display = "none"
    )

    cancelButton.addEventListener(
        "click",
        () => modal.style.display = "none"
    )

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
          showError(`Error deleting row ${rowId}: ${e}`);
      }

      modal.style.display = "none";
    }

    // also close modal when user clicks outside the modal
    window.onclick = function(event) {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    }
}

function fetchData(page, filterText) {
    function generateDivs(row) {
        return `
            <div id="short-${row.id}" class="item-cell">${row.short}</div>
            <div id="url-${row.id}" class="url-cell">${row.url}</div>
            <div class="item-cell">
                <div id="edit-${row.id}" style="display: block">✏️</div>
                <div id="save-${row.id}" style="display: none">✅</div>
            </div>
            <div id="delete-${row.id}" class="item-cell">➖</div>
        `
    }

    function addHandlers(rowId) {
        eid(`edit-${rowId}`).addEventListener(
            "click",
            () => {
                const shortText = eid(`short-${rowId}`).innerText;
                const urlText = eid(`url-${rowId}`).innerText;
                eid(`short-${rowId}`).innerHTML = `<input style="width: 160px;" id="updateShort-${rowId}" value="${shortText}">`;
                eid(`url-${rowId}`).innerHTML = `<input style="width: 360px;" id="updateURL-${rowId}" value="${urlText}">`;
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
    let filterValue = filterText || '';
    let url = `/edit?api=fetch&page=${pageValue}&filter=${filterValue}`;

    try {
        fetch(url).then(
            (response) => response.json().then(
                (result) => {
                 gridContainer.innerHTML = result.items.map(generateDivs).join("");
                 result.items.forEach(
                     (x) => addHandlers(x.id)
                 );
                 pageNumber = result["page"];
                 if (result["moreItems"]) moreNumbersButton.style.display = "block";
                 else moreNumbersButton.style.display = "none";
                 if (result["previousItems"]) prevNumbersButton.style.display = "block";
                 else prevNumbersButton.style.display = "none";
                }
             )
        );
    }
    catch (e) {
        showError(e);
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

        function addItem() {
            try {
                fetch(
                    "/edit",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({short: short, url: url}),
                    }
                ).then((response) => {
                    if (response.status === 200) {
                        shortSelector.value = '';
                        urlSelector.value = '';
                        addContainer.style.display = 'none';
                        fetchData(pageNumber);
                    } else {
                        response.json().then(
                            (result) => {
                                showError(result.data)
                            }
                        )
                    }
                });
            }
            catch (error) {
                showError(error);
            }
        }
        addItem();
    }
)

eid("filterButton").addEventListener(
    "click",
    () => {
        filterText = eid("filter").value;
        fetchData(pageNumber, filterText);
    }
)

fetchData(pageNumber);