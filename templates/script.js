const eid = (elementId) => {
    return {
        el: document.getElementById(elementId),
        click: function (func) {
            this.el.addEventListener(
                "click",
                () => func()
            );
        },
        enter: function (func) {
            this.el.addEventListener(
                "keydown",
                (e) => {
                    if (e.key === "Enter") func()
                }
            )
        }
    }
}

const shortSelector = eid("short").el;
const urlSelector = eid("url").el;
const addContainer = eid("addContainer").el;
const gridContainer = eid("gridContainer").el;
const prevNumbersButton = eid("previousItems").el;
const moreNumbersButton = eid("moreItems").el;

let pageNumber = 1;
let filterText;


function showError(errorMessage) {
    eid("errorMsg").el.innerText = errorMessage;
    eid("errorModal").el.style.display = "block";
    eid("errorCloseButton").click(
        () => eid("errorModal").el.style.display = "none"
    );
    const modal = eid("errorModal").el;
    // also close modal when user clicks outside the modal
    window.onclick = function(event) {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    }
}

function runFilter(){
    filterText = eid("filter").el.value;
    fetchData(pageNumber, filterText);
}


function editRow(rowId) {
    try {
        const short = eid(`updateShort-${rowId}`).el.value;
        const url = eid(`updateURL-${rowId}`).el.value;
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
    const modal = eid("confirmationModal").el;
    const closeButton = eid("closeButton");
    const cancelButton = eid("cancelButton");
    const confirmButton = eid("confirmButton");
    const short = eid(`short-${rowId}`).el.innerText;
    eid("deleteConfirmMsg").el.innerText = `This will remove the entry for ${short}.`
    modal.style.display = "block"

    closeButton.click(
        () => modal.style.display = "none"
    )

    cancelButton.click(
        () => modal.style.display = "none"
    )

    confirmButton.click(
        () => {
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
    )

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
        eid(`edit-${rowId}`).click(
            () => {
                const shortText = eid(`short-${rowId}`).el.innerText;
                const urlText = eid(`url-${rowId}`).el.innerText;
                eid(`short-${rowId}`).el.innerHTML = `<input style="width: 160px;" id="updateShort-${rowId}" value="${shortText}">`;
                eid(`url-${rowId}`).el.innerHTML = `<input style="width: 360px;" id="updateURL-${rowId}" value="${urlText}">`;
                eid(`edit-${rowId}`).el.style.display = "none";
                eid(`save-${rowId}`).el.style.display = "block";
                eid(`short-${rowId}`).enter(
                    () => editRow(rowId)
                );
                eid(`url-${rowId}`).enter(
                    () => editRow(rowId)
                );
            }
        )
        eid(`save-${rowId}`).click(
            () => editRow(rowId)
        )
        eid(`delete-${rowId}`).click(
            () => deleteRow(rowId)
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

eid("newButton").click(
    () => {
        if (addContainer.style.display === "grid") {
            addContainer.style.display = "none";
        } else {
            addContainer.style.display = "grid";
        }
    }
)

eid("addLinkButton").click(
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

eid("filterButton").click(runFilter);
eid("filter").enter(runFilter);

fetchData(pageNumber);