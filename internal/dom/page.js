
var goapp = {
    nodes: {
        "root:": document.body
    }
};

function render(changes = []) {
    changes.forEach(c => {
        switch (c.Type) {
            case 'createText':
                createText(c);
                break;

            case 'setText':
                setText(c);
                break;

            case 'createElem':
                createElem(c);
                break;

            case 'setAttrs':
                setAttrs(c);
                break;

            case 'appendChild':
                appendChild(c);
                break;

            case 'removeChild':
                removeChild(c);
                break;

            case 'replaceChild':
                replaceChild(c);
                break;

            case 'mountElem':
                mountElem(c);
                break;

            case 'createCompo':
                createCompo(c);
                break;

            case 'setCompoRoot':
                setCompoRoot(c);
                break;

            case 'deleteNode':
                deleteNode(c);
                break;

            default:
                console.log(c.Type + ' change is not supported');
        }
    });
}

function createText(change = {}) {
    const { ID } = change.Value;
    const n = document.createTextNode("");

    n.ID = ID;
    goapp.nodes[ID] = n;
}

function setText(change = {}) {
    const { ID, Text } = change.Value;

    const n = goapp.nodes[ID];
    if (!n) {
        return;
    }

    n.nodeValue = Text;
}

function createElem(change = {}) {
    const { ID, TagName, Namespace } = change.Value;

    var n = null;
    if (Namespace) {
        n = document.createElementNS(Namespace, TagName);
    } else {
        n = document.createElement(TagName);
    }

    n.ID = ID;
    goapp.nodes[ID] = n;
}

function setAttrs(change = {}) {
    const { ID, Attrs } = change.Value;

    const n = goapp.nodes[ID];
    if (!n) {
        return;
    }

    const nAttrs = n.attributes;
    const toDelete = [];

    for (var i = 0; i < nAttrs.length; i++) {
        const name = nAttrs[i].name;

        if (Attrs[name] === undefined) {
            toDelete.push(name);
        }
    }

    toDelete.forEach(name => {
        n.removeAttribute(name);
    });

    for (var name in Attrs) {
        const curVal = n.getAttribute(name);
        const newVal = Attrs[name];

        if (name === 'value') {
            n.value = newVal;
            continue;
        }

        if (curVal !== newVal) {
            n.setAttribute(name, newVal);
        }
    }
}

function appendChild(change = {}) {
    const { ParentID, ChildID } = change.Value;

    const parent = goapp.nodes[ParentID];
    if (!parent) {
        return;
    }

    const child = childElem(goapp.nodes[ChildID]);
    if (!child) {
        return;
    }

    parent.appendChild(child);
}

function removeChild(change = {}) {
    const { ParentID, ChildID } = change.Value;

    const parent = goapp.nodes[ParentID];
    if (!parent) {
        return;
    }

    const child = childElem(goapp.nodes[ChildID]);
    if (!child) {
        return;
    }

    parent.removeChild(child);
}

function replaceChild(change = {}) {
    const { ParentID, ChildID, OldID } = change.Value;

    const parent = goapp.nodes[ParentID];
    if (!parent) {
        return;
    }

    const newChild = childElem(goapp.nodes[ChildID]);
    if (!newChild) {
        return;
    }


    const oldChild = childElem(goapp.nodes[OldID]);
    if (!oldChild) {
        return;
    }

    parent.replaceChild(newChild, oldChild);
}

function mountElem(change = {}) {
    const { ID, CompoID } = change.Value;

    const n = goapp.nodes[ID];
    if (!n) {
        return;
    }

    n.compoID = CompoID;
}

function createCompo(change = {}) {
    const { ID, Name } = change.Value;

    const compo = {
        ID,
        Name,
        IsCompo: true
    }

    goapp.nodes[ID] = compo;
}

function setCompoRoot(change = {}) {
    const { ID, RootID } = change.Value;
    const compo = goapp.nodes[ID];

    compo.RootID = RootID;
}

function deleteNode(change = {}) {
    const { ID } = change.Value;
    delete goapp.nodes[ID];
}


function childElem(node) {
    if (!node || !node.IsCompo) {
        return node;
    }

    return goapp.nodes[node.RootID];
}

function mapObject(obj) {
    var map = {};

    for (var field in obj) {
        const name = field[0].toUpperCase() + field.slice(1);
        const value = obj[field];
        const type = typeof value;

        switch (type) {
            case 'object':
                break;

            case 'function':
                break;

            default:
                map[name] = value;
                break;
        }
    }
    return map;
}

function callCompoHandler(elem, event, fieldOrMethod) {
    switch (event.type) {
        case 'change':
            onchangeToGolang(elem, fieldOrMethod);
            break;

        case 'drag':
        case 'dragstart':
        case 'dragend':
        case 'dragexit':
            onDragStartToGolang(elem, event, fieldOrMethod);
            break;

        case 'dragenter':
        case 'dragleave':
        case 'dragover':
        case 'drop':
            ondropToGolang(elem, event, fieldOrMethod);
            break;

        case 'contextmenu':
            event.preventDefault();

        default:
            eventToGolang(elem, event, fieldOrMethod);
            break;
    }
}

function onchangeToGolang(elem, fieldOrMethod) {
    golangRequest(JSON.stringify({
        'CompoID': elem.compoID,
        'FieldOrMethod': fieldOrMethod,
        'JSONValue': JSON.stringify(elem.value)
    }));
}

function onDragStartToGolang(elem, event, fieldOrMethod) {
    const payload = mapObject(event.dataTransfer);
    payload['Data'] = elem.dataset.drag;
    setPayloadSource(payload, elem);

    event.dataTransfer.setData('text', elem.dataset.drag);

    golangRequest(JSON.stringify({
        'CompoID': elem.compoID,
        'FieldOrMethod': fieldOrMethod,
        'JSONValue': JSON.stringify(payload)
    }));
}

function ondropToGolang(elem, event, fieldOrMethod) {
    event.preventDefault();

    const payload = mapObject(event.dataTransfer);
    payload['Data'] = event.dataTransfer.getData('text');
    payload['FileOverride'] = 'xxx';
    setPayloadSource(payload, elem);

    golangRequest(JSON.stringify({
        'CompoID': elem.compoID,
        'FieldOrMethod': fieldOrMethod,
        'JSONValue': JSON.stringify(payload),
        'Override': 'Files'
    }));
}

function eventToGolang(elem, event, fieldOrMethod) {
    const payload = mapObject(event);
    setPayloadSource(payload, elem);

    if (elem.contentEditable === 'true') {
        payload['InnerText'] = elem.innerText;
    }

    golangRequest(JSON.stringify({
        'CompoID': elem.compoID,
        'FieldOrMethod': fieldOrMethod,
        'JSONValue': JSON.stringify(payload)
    }));
}

function setPayloadSource(payload, elem) {
    payload['Source'] = {
        'GoappID': elem.ID,
        'CompoID': elem.compoID,
        'ID': elem.id,
        'Class': elem.className,
        'Data': elem.dataset,
        'Value': elem.value
    };
}