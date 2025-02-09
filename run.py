from src.main import app

def run_server():
    app.run(host='0.0.0.0', port=3000, debug=True)

if __name__ == "__main__":
    run_server() 