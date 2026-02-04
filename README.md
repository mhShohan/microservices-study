# Microservices Study Project - R&D

# CLI

- docker inspect container_name
- docker inspect container_name | grep -i IPAddress
- docker exec -it container_name bash
- docker logs container_name
- docker-compose up -d

### connect to docker container database

- `postgres` - container name, or
- `host.docker.internal` , or
- by using ip address of the container, view the ip address by `docker inspect <container_name>` this command and view the network object
