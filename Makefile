b64 := $(shell gzip -c lattice_sphere_cmp.js | base64 -w0)

all:
	@sed 's,___BASE64___,'"${b64}"',' redirect_template.html > index.html
