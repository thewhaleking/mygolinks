const eid = (elementId) => {
    return {
        el: document.getElementById(elementId),
        click: function (func) {
            this.el.addEventListener(
                "click",
                func
            );
        },
        enter: function (func) {
            this.el.addEventListener(
                "keydown",
                (e) => {
                    if (e.key === "Enter") func()
                }
            )
        },
        getValue: function () {
            return this.el.value;
        },
        setValue: function (value) {
            this.el.value = value;
        },
        show: function (type)  {
            this.el.style.display = type || "block";
        },
        hide: function () {
            this.el.style.display = "none";
        },
        isVisible: function () {
            return (this.el.style.display === '' || this.el.style.display !== "none");
        },
        setHTML: function (value) {
            this.el.innerHTML = value;
        },
        setText: function (value) {
            this.el.innerText = value;
        }
    }
}


let pageNumber = 1;


function showError(errorMessage) {
    const modal = eid("errorModal");
    eid("errorMsg").setText(errorMessage);
    eid("errorModal").show();
    eid("errorCloseButton").click(
        () => modal.hide()
    );
    // also close modal when user clicks outside the modal
    window.onclick = function(event) {
      if (event.target === modal.el) {
          modal.hide();
      }
    }
}

function runFilter(){
    fetchData(pageNumber, eid("filter").getValue());
}


function editRow(rowId) {
    try {
        const short = eid(`updateShort-${rowId}`).getValue();
        const url = eid(`updateURL-${rowId}`).getValue();
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
    const short = eid(`short-${rowId}`).el.innerText;
    eid("deleteConfirmMsg").setText(`This will remove the entry for ${short}.`);
    modal.show();

    closeButton.click(
        () => modal.hide()
    )

    cancelButton.click(
        () => modal.hide()
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

          modal.hide();
        }
    )

    // also close modal when user clicks outside the modal
    window.onclick = function(event) {
      if (event.target === modal.el) {
          modal.hide()
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
                eid(`short-${rowId}`).setHTML(`<input style="width: 160px;" id="updateShort-${rowId}" value="${shortText}">`);
                eid(`url-${rowId}`).setHTML(`<input style="width: 360px;" id="updateURL-${rowId}" value="${urlText}">`);
                eid(`edit-${rowId}`).hide();
                eid(`save-${rowId}`).show();
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
                 eid("gridContainer").setHTML(result.items.map(generateDivs).join(""));
                 result.items.forEach(
                     (x) => addHandlers(x.id)
                 );
                 pageNumber = result["page"];

                 const prevItems = eid("previousItems");
                 const moreItems = eid("moreItems");

                 if (result["moreItems"]) moreItems.show();
                 else moreItems.hide();
                 if (result["previousItems"]) prevItems.show();
                 else prevItems.hide();
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
        const addContainer = eid("addContainer");
        if (addContainer.isVisible()) {
            addContainer.hide();
        } else {
            addContainer.show("grid");
        }
    }
)

eid("addLinkButton").click(
    () => {
        const short = eid("short").getValue();
        const url = eid("url").getValue();

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
                        const addContainer = eid("addContainer");
                        eid("short").setValue('');
                        eid("url").setValue('');
                        addContainer.hide();
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