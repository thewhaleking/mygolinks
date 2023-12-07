import sqlite3
from flask import Flask, render_template, redirect, url_for, request, jsonify, make_response, g


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
        short VARCHAR(255),
        url VARCHAR(255)
    )
    '''
    cursor.execute(create_table_query)
    conn.commit()
    conn.close()


def create_app():
    app = Flask(__name__)
    table_creation()  # Ensures table is created if it does not already exist

    @app.get("/edit")
    def edit_get():
        def query(page_number):
            conn = connect_db()
            cursor = conn.cursor()
            page_size = 50
            cursor.execute("SELECT COUNT(*) FROM links")
            total_items = cursor.fetchone()['COUNT(*)']
            offset = (page_number - 1) * page_size
            cursor.execute("SELECT * FROM links LIMIT 50 OFFSET ?", (offset,))
            items_ = cursor.fetchall()
            more_items_ = True if (total_items > len(items_) + (offset * page_size)) else False
            previous_items_ = True if page_number > 1 else False
            return items_, more_items_, previous_items_

        page_number_ = int(request.args.get("page_number", 1)) or 1
        items, more_items, previous_items = query(page_number_)
        return render_template(
            "index.j2",
            items=items,
            more_items=more_items,
            previous_items=previous_items,
            page_number=page_number_
        )

    @app.post("/edit")
    def edit_post():
        conn = connect_db()
        r = request.get_json()
        cursor = conn.cursor()
        short = r.get('short')
        url = r.get('url')
        if not any([short, url]):
            return make_response(jsonify({"data": "Missing fields"}), 400)
        e = cursor.execute("SELECT * FROM links WHERE short = ?", (short,)).fetchone()
        if e:
            response = (jsonify({"data": "That links already exists"}), 400)
        else:
            cursor.execute(
                "INSERT INTO links (short, url) VALUES (?, ?)",
                (short, url)
            )
            conn.commit()
            response = (jsonify({"data": f"{short}"}), 200)
        return make_response(*response)

    @app.get("/<string:short>")
    def goto(short):
        conn = connect_db()
        cursor = conn.cursor()
        url_fetch = cursor.execute(
            "SELECT url FROM links WHERE short = ?",
            (short,)
        ).fetchone()
        if url := url_fetch.get("url"):
            return redirect(url)
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
