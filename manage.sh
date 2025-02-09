#!/bin/bash

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Set environment variables
export FLASK_APP=src.main:app
export PYTHONPATH=$DIR
export PORT=3000

# Ensure instance directory exists and is writable
ensure_instance_dir() {
    INSTANCE_DIR="$DIR/instance"
    mkdir -p "$INSTANCE_DIR"
    chmod 777 "$INSTANCE_DIR"
    echo "Ensured instance directory at $INSTANCE_DIR"
}

check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        echo "Port $PORT is already in use. Stopping existing process..."
        lsof -Pi :$PORT -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
        sleep 2
    fi
}

start_server() {
    check_port
    ensure_instance_dir
    echo "Starting server on port $PORT..."
    if [ "$DEBUG" = "true" ]; then
        python run.py
    else
        gunicorn \
            --bind 0.0.0.0:$PORT \
            --chdir "$DIR" \
            --timeout 120 \
            --workers 1 \
            --worker-class sync \
            --pid "$DIR/gunicorn.pid" \
            --log-level debug \
            'run:app'
    fi
}

stop_server() {
    echo "Stopping server..."
    if [ -f "$DIR/gunicorn.pid" ]; then
        pid=$(cat "$DIR/gunicorn.pid")
        kill -9 $pid 2>/dev/null
        rm "$DIR/gunicorn.pid"
    fi
    pkill -f "gunicorn.*run:app"
    pkill -f "python.*run.py"
    check_port
    echo "Server stopped"
}

case "$1" in
    "start")
        if [ -d "$DIR/.venv" ]; then
            source "$DIR/.venv/bin/activate"
            start_server
        else
            echo "Virtual environment not found"
            exit 1
        fi
        ;;
    "debug")
        if [ -d "$DIR/.venv" ]; then
            source "$DIR/.venv/bin/activate"
            DEBUG=true start_server
        else
            echo "Virtual environment not found"
            exit 1
        fi
        ;;
    "stop")
        stop_server
        ;;
    "restart")
        stop_server
        sleep 2
        start_server
        ;;
    "status")
        if [ -f "$DIR/gunicorn.pid" ] && ps -p $(cat "$DIR/gunicorn.pid") > /dev/null; then
            echo "Server is running on port $PORT (PID: $(cat "$DIR/gunicorn.pid"))"
            lsof -i :$PORT
        else
            echo "Server is not running"
        fi
        ;;
    *)
        echo "Usage: $0 {start|debug|stop|restart|status}"
        exit 1
        ;;
esac 