import sqlite3

from flask import Flask, render_template, redirect, url_for, request, jsonify, make_response, g
import validators


def connect_db():
    conn = getattr(g, '_database', None)
    if conn is None:
        conn = g._database = sqlite3.connect('links.db')
        conn.row_factory = sqlite3.Row
    return conn


def table_creation():
    conn = sqlite3.connect('links.db')
    cursor = conn.cursor()
    create_table_query = '''
    CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY,
        short VARCHAR(255),
        url VARCHAR(255)
    )
    '''
    cursor.execute(create_table_query)
    conn.commit()
    conn.close()


def create_app():
    app = Flask(__name__, static_url_path="/static/", static_folder="static/")
    table_creation()  # Ensures table is created if it does not already exist

    @app.get("/edit")
    def edit_get():
        if request.args.get("api", ""):
            return edit_api(request)

        return render_template(
            "index.html"
        )

    def edit_api(request_):
        def query(page_number, filter_text):
            conn = connect_db()
            cursor = conn.cursor()

            page_size = 50
            filter_params = [f"%{filter_text}%", f"%{filter_text}%"]
            filter_query = "WHERE short LIKE ? OR url LIKE ? "

            count_query = "SELECT COUNT(*) FROM links "
            full_count_query = count_query + filter_query if filter_text else count_query
            count_params = filter_params if filter_text else []

            cursor.execute(full_count_query, count_params)
            total_items = cursor.fetchone()['COUNT(*)']
            offset = (page_number - 1) * page_size

            sq1 = "SELECT * FROM links "
            sq2 = "LIMIT ? OFFSET ?"
            selection_params = [page_size, offset]
            full_selection_query = sq1 + filter_query + sq2 if filter_text else sq1 + sq2
            full_selection_params = filter_params + selection_params if filter_text else selection_params

            cursor.execute(full_selection_query, full_selection_params)
            items_ = cursor.fetchall()
            more_items_ = True if (total_items > len(items_) + (offset * page_size)) else False
            previous_items_ = True if page_number > 1 else False

            return items_, more_items_, previous_items_

        if request_.args.get("api", "") == "fetch":
            page_number_ = int(request.args.get("page", 1)) or 1
            items, more_items, previous_items = query(page_number_, request.args.get("filter"))
            return make_response(jsonify(
                {
                    "items": [{"short": x["short"], "url": x["url"], "id": x["id"]} for x in items],
                    "moreItems": more_items,
                    "previousItems": previous_items,
                    "page": page_number_
                }
            ))

    @app.put("/edit")
    def edit_put():
        conn = connect_db()
        r = request.get_json()
        cursor = conn.cursor()
        if not all([short := r.get("short"), validators.url(url := r.get("url")), id_ := r.get("id")]):
            return make_response(jsonify({"data": f"Invalid: {short} | {url}"}), 400)
        cursor.execute(
            "UPDATE links SET short = ?, url = ? WHERE id = ?",
            (short, url, id_)
        )
        conn.commit()
        return make_response(jsonify({"data": f"Updated successfully: {short} | {url}"}), 200)

    @app.delete("/edit")
    def edit_delete():
        conn = connect_db()
        r = request.get_json()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM links WHERE id = ?", (r.get("id"),))
        conn.commit()
        return make_response(jsonify({"data": "Row successfully deleted"}), 200)

    @app.post("/edit")
    def edit_post():
        conn = connect_db()
        r = request.get_json()
        cursor = conn.cursor()
        short = str(r.get('short')).lower()
        url = r.get('url')
        if not any([short, url]):
            return make_response(jsonify({"data": "Missing fields"}), 400)
        if not validators.url(url):
            return make_response(jsonify({"data": "Invalid URL"}), 400)
        e = cursor.execute("SELECT * FROM links WHERE short = ?", (short,)).fetchone()
        if e:
            return make_response(jsonify({"data": "That link already exists"}), 400)
        else:
            cursor.execute(
                "INSERT INTO links (short, url) VALUES (?, ?)",
                (short, url)
            )
            conn.commit()
            return make_response(jsonify({"data": f"{short}"}), 200)

    @app.get("/<string:short>")
    def goto(short):
        conn = connect_db()
        cursor = conn.cursor()
        url_fetch = cursor.execute(
            "SELECT url FROM links WHERE short = ?",
            (short,)
        ).fetchone()
        if url_fetch:
            return redirect(url_fetch["url"])
        else:
            return redirect(url_for('edit_get'))

    @app.teardown_appcontext
    def shutdown_session(_):
        db = getattr(g, '_database', None)
        if db is not None:
            db.close()

    return app


if __name__ == "__main__":
    flask_app = create_app()
    flask_app.run("0.0.0.0", port=8080)
