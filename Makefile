b64 := $(shell gzip -c lattice_sphere_cmp.js | base64 -w0)
b64tf := $(shell gzip -c tangential_faces.js | base64 -w0)
b64mse := $(shell gzip -c mse.js | base64 -w0)
b64pt := $(shell gzip -c pt.js | base64 -w0)

all: index.html tangential_faces.html mse.html pt.html

index.html: lattice_sphere_cmp.js
	@sed 's,___BASE64___,'"${b64}"',' redirect_template.html > index.html

tangential_faces.html: tangential_faces.js
	@sed 's,___BASE64___,'"${b64tf}"',' redirect_template.html > tangential_faces.html

mse.html: mse.js
	@sed 's,___BASE64___,'"${b64mse}"',' redirect_template.html > mse.html

pt.html: pt.js
	@sed 's,___BASE64___,'"${b64pt}"',' redirect_template.html > pt.html
