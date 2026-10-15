// Visible UI only; imported by cua_repl after the common replay runner.
export async function replayInteractions(tab,save){
 await tab.playwright.locator('[data-view="eaves"]').click();
 await tab.playwright.locator('[data-mode="d"]').click();
 await tab.playwright.locator('#explode').setChecked(false);
 await tab.playwright.locator('#light').setChecked(false);
 await tab.playwright.locator('#pick-sample').click();
 await tab.getAXState({emit:false});
 await save('selected-original.jpg',await tab.screenshot({fullPage:true}));
 const selected=JSON.parse(await tab.playwright.locator('#stats').textContent());
 if(selected.selected!=='foguang/west-eave/v1/eave-disk/0/0'||selected.selectionLayer!=='roof')throw Error('Wrong selected stable ID');
 await tab.playwright.locator('#explode').setChecked(true);await tab.getAXState({emit:false});
 await save('selected-lift.jpg',await tab.screenshot({fullPage:true}));
 const lifted=JSON.parse(await tab.playwright.locator('#stats').textContent());
 if(lifted.selected!==selected.selected||lifted.roofWorldY!==2||lifted.anchorWorldY!==0)throw Error('Selection/layer ownership regressed');
 await tab.playwright.locator('#explode').setChecked(false);
 await tab.playwright.locator('#viewport').press('ArrowLeft');await tab.getAXState({emit:false});
 await tab.screenshot({fullPage:true});
 const rotated=JSON.parse(await tab.playwright.locator('#stats').textContent());
 if(JSON.stringify(rotated.camera)===JSON.stringify(selected.camera))throw Error('Keyboard rotation failed');
 await tab.playwright.locator('#viewport').press('0');await tab.getAXState({emit:false});
 await save('keyboard-reset.jpg',await tab.screenshot({fullPage:true}));
 const reset=JSON.parse(await tab.playwright.locator('#stats').textContent());
 if(reset.camera.some((n,i)=>Math.abs(n-selected.camera[i])>1e-8))throw Error('Reset camera drift');
 await tab.playwright.locator('canvas').click();await tab.getAXState({emit:false});
 await save('canvas-pick.jpg',await tab.screenshot({fullPage:true}));
 const picked=JSON.parse(await tab.playwright.locator('#stats').textContent());
 if(!picked.selected)throw Error('Canvas raycast did not select a record');
 return {selected,lifted,rotated,reset,picked};
}
