from http.server import BaseHTTPRequestHandler, HTTPServer

def server(url: str) -> str:
    """
    url is a *PARTIAL* URL. If the browser requests `http://localhost:4131/contact?name=joe`
    then the `url` parameter will have the value "/contact?name=joe". (so the schema,
    authority and anchor will not be included, but the full path, any query will be included)

    This function is called each time another program/computer makes a request to this website.
    The URL represents the requested file.

    This function should return a string.
    """
    print(url)
    #Get rid of any extra queries (stuff after "?") in the URL
    query_pos = url.find("?") #Referenced https://www.w3schools.com/python/ref_string_find.asp
    if query_pos != -1:
        url = url[:query_pos]
    print(url)

    #Returning the proper file
    if url == "/" or url == "/about":
         filename = "about.html"
    elif url == "/orders" or url == "/admin/orders":
        filename = "orders.html"
    else:
        filename = "404.html"

    print(filename)
    #Attempt to open the file at filename
    try:
        with open(f"static/html/{filename}", encoding="utf-8") as f:
            return f.read()
    except:
        return "<h1>Uh oh, this file doesn't exist extra special 404</h1>"


# You shouldn't need to change content below this. It would be best if you just left it alone.


class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Call the student-edited server code.
        message = server(self.path)

        # Convert the return value into a byte string for network transmission
        if type(message) == str:
            message = bytes(message, "utf8")

        # prepare the response object with minimal viable headers.
        self.protocol_version = "HTTP/1.1"
        # Send response code
        self.send_response(200)
        # Send headers
        # Note -- this would be binary length, not string length
        self.send_header("Content-Length", len(message))
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()

        # Send the file.
        self.wfile.write(message)
        return


def run():
    PORT = 4131
    print(f"Starting server http://localhost:{PORT}/")
    server = ("", PORT)
    httpd = HTTPServer(server, RequestHandler)
    httpd.serve_forever()


run()
