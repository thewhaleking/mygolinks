    const shortSelector = document.getElementById("short");
    const urlSelector = document.getElementById("url");
    const addContainer = document.getElementById("addContainer")
    const gridContainer = document.getElementById("gridContainer");
    const prevNumbersButton = document.getElementById("previousItems");
    const moreNumbersButton = document.getElementById("moreItems");

    let pageNumber = 1;
    let moreNumbers = false;
    let previousNumbers = false;

    function editRow(rowId) {
        try {
            const short = document.getElementById(`updateShort-${rowId}`).value;
            const url = document.getElementById(`updateURL-${rowId}`).value;
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
        const modal = document.getElementById("confirmationModal");

        // Get the elements that can close the modal
        const closeButton = document.getElementsByClassName("close-button")[0];
        const cancelButton = document.getElementById("cancelButton");
        const confirmButton = document.getElementById("confirmButton");
        const short = document.getElementById(`short-${rowId}`).innerText;
        document.getElementById("deleteConfirmMsg").innerText = `This will remove the entry for ${short}.`
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
            document.getElementById(`edit-${rowId}`).addEventListener(
                "click",
                () => {
                    const shortText = document.getElementById(`short-${rowId}`).innerText;
                    const urlText = document.getElementById(`url-${rowId}`).innerText;
                    document.getElementById(`short-${rowId}`).innerHTML = `<input style="width: 180px;" id="updateShort-${rowId}" value="${shortText}">`;
                    document.getElementById(`url-${rowId}`).innerHTML = `<input style="width: 380px;" id="updateURL-${rowId}" value="${urlText}">`;
                    document.getElementById(`edit-${rowId}`).style.display = "none";
                    document.getElementById(`save-${rowId}`).style.display = "block";
                }
            )
            document.getElementById(`save-${rowId}`).addEventListener(
                "click",
                () => editRow(rowId)
            )
            document.getElementById(`delete-${rowId}`).addEventListener(
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

    document.getElementById("newButton").addEventListener(
        "click",
        () => {
            if (addContainer.style.display === "grid") {
                addContainer.style.display = "none";
            } else {
                addContainer.style.display = "grid";
            }
        }
    );

    document.getElementById("addLinkButton").addEventListener(
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